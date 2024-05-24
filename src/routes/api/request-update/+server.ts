import type { RequestHandler } from '@sveltejs/kit';
import * as env from '$env/static/private';
import axios from 'axios';
import { parse } from 'node-html-parser';
import { kv, kvKeys } from '$lib/server/kv';
import { spotify } from '$lib/server/spotify';
import { setUpdatingState, updating, type UpdateResult } from '$lib/server/updating-state';
import { overrides } from '$lib/server/overrides';

const updateInterval = Number(env.UPDATE_CHECK_INTERVAL) || 600
const retryDelay = Number(env.RETRY_DELAY) || 60
const blacklist = ["remix", "edit", "instrumental", "sped up", "slowed", "reverb", "acoustic", "피아노", "inst."]

function replaceDatetimePlaceholders(text: string) {
    const newDate = new Date()
    const formattedDate = new Intl.DateTimeFormat('ko-KR', {year: '2-digit', month: '2-digit', day: '2-digit', timeZone: 'Asia/Seoul'}).format(new Date(newDate))
    const formattedTime = new Intl.DateTimeFormat('ko-KR', {hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Seoul'}).format(new Date(newDate))
    const date_6digit = formattedDate.replace(/\. ?/g, '')
    
    return text.replace('%DATE%', formattedDate).replace('%TIME%', formattedTime).replace('%DATE_6DIGIT%', date_6digit);
}

function getCurrentTimestamp() {
    return new Date().getTime() / 1000
}

async function updatePlaylist(name: string): Promise<UpdateResult> {
    if (!env.REFRESH_TOKEN) return {
        success: false,
        message: 'Refresh Token이 없습니다. /getting-refresh-token'
    };
    const refreshData = await spotify.refreshAccessToken()
    spotify.setAccessToken(refreshData.body.access_token)

    const newPlaylistName = replaceDatetimePlaceholders(env.PLAYLIST_NAME || '%DATE_6DIGIT% MELON TOP 100')
    const newPlaylistDesc = replaceDatetimePlaceholders(env.PLAYLIST_DESC || '한국 시간 %DATE% %TIME% 기준')

    await spotify.changePlaylistDetails(env.PLAYLIST_ID, { name: newPlaylistName, description: newPlaylistDesc })

    // crawl melon chart
    const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36"
    }

    const response = await axios.get(env.MELON_URL || 'https://www.melon.com/chart/index.htm', { headers })

    const root = parse(response.data);

    const songs = root.querySelectorAll('.lst50, .lst100');
    const chart = songs.map(song => {
        const title = song.querySelector('.ellipsis.rank01')?.text.trim()!;
        const artist = song.querySelector('.ellipsis.rank02 a')?.text.trim()!;

        return {
            title, artist,
            id: `${title} - ${artist}`
        };
    });

    if (chart.length === 0) return {
        success: false,
        message: '멜론 차트 정보를 가져오는데 실패했습니다.'
    }

    // I know HGETALL is slow, but Vercel limits requests for KV so don't blame me :(
    const cachedSearchResults = (await kv.hgetall(kvKeys.CACHED_SEARCH_RESULTS)) as Record<string, string> ?? {}

    if (env.UPDATE_WHEN_CHART_NOT_CHANGED !== "true") {
        if (Object.keys(cachedSearchResults) === chart.map(song => song.id)) return {
            success: true,
            message: '멜론 차트에 변동 사항이 없습니다.'
        }
    }

    // artists' names will be used to improve track search results
    const cachedArtists: Record<string, string> = (await kv.hgetall(kvKeys.CACHED_ARTISTS)) as Record<string, string> ?? {}
    const artistSet = [...new Set(chart.map(song => song.artist))]; // using Set to remove duplicated values

    const artistsToCache: Record<string, string> = {};
    
    await Promise.all(artistSet.map(async (artist) => {
        if (cachedArtists[artist]) return;
        const results = await spotify.searchArtists(artist, { market: 'KR' })
        const artistURI = results.body.artists?.items[0]?.uri;
        if (artistURI) artistsToCache[artist] = artistURI;
    }));

    // cache artists
    if (Object.keys(artistsToCache).length > 0) kv.hset(kvKeys.CACHED_ARTISTS, artistsToCache)
    kv.expire('knownartists', 60 * 60 * 24 * 7)
    const artists = {...cachedArtists, ...artistsToCache, ...overrides.artists}

    // search tracks
    const resultsToCache: Record<string, string> = {}
    const trackURIPromises = await Promise.allSettled(
        chart.map(async (song): Promise<string> => {
            // filter blacklisted tracks
            let track_uri = env.UNAVAILABLE_TRACK_URI || 'spotify:track:4jaXxB0DJ6X4PdjMK8XVfu' // if not found, it will use this placeholder track
            if (overrides.artists[song.artist] === null || overrides.tracks[song.id] === null) return track_uri;

            // use overrides if possible
            if (overrides.tracks[song.id]) return overrides.tracks[song.id]!;

            // use cached search results if possible
            if (cachedSearchResults[song.id]) return cachedSearchResults[song.id]

            // find track on spotify
            const results = await spotify.search(song.title, ['album', 'track'], { market: 'KR' })
            let tracks = results.body.tracks?.items ?? [];
            const albumIDs = results.body.albums?.items.map(album => album.id) ?? [];
            if (albumIDs.length > 0) {
              // 'simplified' Albums from /search has no tracks array, so it needs another API request to /albums.
              const results = await spotify.getAlbums(albumIDs, { market: 'KR' })
              const albumTracks = results.body.albums.map(album => album.tracks.items[0] as SpotifyApi.TrackObjectFull) 
              tracks = [...albumTracks, ...tracks]
            }

            // filter tracks by blacklisted keywords and artist name
            const filteredTracks = tracks?.filter(track => 
                // filter song names with blacklisted keywords if song.title does not contain it
                !blacklist.some(keyword => track.name.toLowerCase().includes(keyword) && !song.title.toLowerCase().includes(keyword))
            ) ?? [];
            const tracksByArtist = filteredTracks?.filter(track => 
                track.artists.some(artist => artist.uri === artists[song.artist])
            ) ?? [];
            
            // use filtered tracks if possible
            if (tracksByArtist.length > 0) {
                tracks = tracksByArtist
                // use exact match if possible
                const exactMatchTracks = tracks.filter(track => track.name.toLowerCase() === song.title.toLowerCase());
                if (exactMatchTracks.length > 0) tracks = exactMatchTracks;
                resultsToCache[song.id] = tracks[0].uri
            }
            else if (filteredTracks.length > 0) tracks = filteredTracks

            if (tracks && tracks.length > 0) track_uri = tracks[0].uri
            return track_uri
        })
    )
    
    // cache track search results
    if (Object.keys(resultsToCache).length > 0) kv.hset(kvKeys.CACHED_SEARCH_RESULTS, resultsToCache)
    kv.expire(kvKeys.CACHED_SEARCH_RESULTS, 60 * 60 * 24)

    // if some Search API requests failed, throw an error
    if (trackURIPromises.some(result => result.status === 'rejected')) return {
        success: false,
        message: '트랙 검색 중 Spotify API 오류가 발생했습니다. 잠시 후에 다시 시도해주세요.'
    }

    const trackURIs = trackURIPromises.map((result: PromiseSettledResult<string>) => 
    (result as PromiseFulfilledResult<string>).value);

    // replace tracks in playlist
    const maxRetries = 3

    for (let i = 0; i < maxRetries; i++) {
        try {
            await spotify.replaceTracksInPlaylist(env.PLAYLIST_ID, trackURIs);
            break;
        } catch (e) {
            if (i === maxRetries - 1) return {
                success: false,
                message: '플레이리스트 변경 중 Spotify API 오류가 발생했습니다. 잠시 후에 다시 시도해주세요.'
            };
            await new Promise(resolve => setTimeout(resolve, 4000));
        }
    }

    // update last update data
    kv.hset(kvKeys.LAST_UPDATE, { at: getCurrentTimestamp(), by: name })
    const currentCount = await kv.zincrby(kvKeys.TOP_UPDATERS, 1, name)
    return {
        success: true,
        message: `갱신 성공! ${name} (${currentCount})`
    }
}

async function startUpdating(name: string) {
    setUpdatingState(true)
    let result: UpdateResult;
    await kv.set(kvKeys.NEXT_UPDATE, getCurrentTimestamp() + updateInterval)
    try {
        // timeout after 30 seconds
        const timeoutPromise = new Promise<UpdateResult>((resolve) => {
            setTimeout(() => {
                resolve({
                    success: false,
                    message: '시간 초과!'
                });
            }, 30000);
        });

        result = await Promise.race([
            updatePlaylist(name),
            timeoutPromise
        ]);
    } catch (e) {
        console.error(e)
        result = {
            success: false,
            message: '알 수 없는 오류가 발생했습니다.'
        }
    }
    setUpdatingState(false, result)
    if (!result.success) await kv.set(kvKeys.NEXT_UPDATE, getCurrentTimestamp() + retryDelay)
    return result
}

export const GET: RequestHandler = async ({ request }) => {
    const url = new URL(request.url);
    const name = url.searchParams.get('name') ?? `익명${Math.floor(Math.random() * 100000000)}`;
    
    // name validation    
    if (name.length < 1) return new Response(JSON.stringify({success: false, message: "이름은 최소 1자 이상이어야 합니다."}), {status: 400});
    if (name.length > 16) return new Response(JSON.stringify({success: false, message: "이름은 최대 16자 이하이어야 합니다."}), {status: 400});

    const nameRegex = /^[A-Za-z0-9ㄱ-ㅎ가-힣]+$/;
    if (!nameRegex.test(name)) {
        return new Response(JSON.stringify({success: false, message: "이름은 영문, 한글, 숫자만 포함해야 합니다."}), {status: 400});
    }

    const blacklistedWords = ['도박', '카지노', '베팅']; // add as many as you want
    for (let word of blacklistedWords) {
        if (name.includes(word)) {
            return new Response(JSON.stringify({success: false, message: `이름에 금지된 단어 '${word}' 가 포함되어 있습니다.`}), {status: 400});
        }
    }

    // check last update
    const remainingTime = Math.floor(Number(await kv.get(kvKeys.NEXT_UPDATE)) - getCurrentTimestamp())

    if (remainingTime > 0)
    return new Response(JSON.stringify({success: false, message: `플레이리스트가 이미 최근에 갱신되었습니다. ${remainingTime}초 뒤에 다시 시도하세요.`}), {status: 202, headers: { 'Retry-After': Math.floor(remainingTime).toString() }})

    if (updating) return new Response(JSON.stringify({success: false, message: "이미 다른 갱신 요청이 처리 중이에요. 잠시 기다려주세요."}), {status: 202})

    if (url.searchParams.get('wait')?.toLowerCase() === 'true') {
        const result = await startUpdating(name)
        return new Response(JSON.stringify(result), {status: result.success ? 200 : 500})
    }

    startUpdating(name)
    return new Response(JSON.stringify({success: true, message: "갱신 요청이 완료되었습니다. 곧 페이지가 새로 고침 됩니다."}))
}