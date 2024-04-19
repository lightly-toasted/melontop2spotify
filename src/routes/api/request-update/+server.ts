import type { RequestHandler } from '@sveltejs/kit';
import * as env from '$env/static/private';
import axios from 'axios';
import { parse } from 'node-html-parser';
import { kv } from '$lib/server/kv';
import { spotify } from '$lib/server/spotify';
import { setUpdatingState, updating, type UpdateResult } from '$lib/server/updating-state';
import md5 from 'md5';

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
    // update playlist descriptions
    kv.set('lastcheck', getCurrentTimestamp())

    const refreshData = await spotify.refreshAccessToken()
    spotify.setAccessToken(refreshData.body.access_token)

    const newPlaylistName = replaceDatetimePlaceholders(env.PLAYLIST_NAME)
    const newPlaylistDesc = replaceDatetimePlaceholders(env.PLAYLIST_DESC)

    await spotify.changePlaylistDetails(env.PLAYLIST_ID, { name: newPlaylistName, description: newPlaylistDesc })

    // crawl melon chart
    const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36"
    }

    const response = await axios.get(env.MELON_URL, { headers })

    const root = parse(response.data);
    const chart: {
        title: string,
        artist: string
    }[] = [];

    const songs = root.querySelectorAll('.lst50, .lst100');
    songs.forEach(song => {
        const title = song.querySelector('.ellipsis.rank01')?.text.trim()!;
        const artist = song.querySelector('.ellipsis.rank02 a')?.text.trim()!;
        chart.push({
            title,
            artist
        });
    });

    if (chart.length === 0) return {
        success: false,
        message: '멜론 차트 정보를 가져오는데 실패했습니다.'
    }

    if (env.UPDATE_WHEN_CHART_NOT_CHANGED !== "true") {
        const chartHash = md5(chart.join(''))
        if (await kv.get('latestmelonchart') == chartHash) return {
            success: false,
            message: '멜론 차트에 변동 사항이 없습니다.'
        }
        kv.set('latestmelonchart', chartHash)
    }

    // artists' names will be used to improve track search results
    // I know HGETALL is slow, but Vercel limits requests for KV so don't blame me :(
    const cachedKnownArtists: Record<string, string> = (await kv.hgetall('knownartists')) as Record<string, string> ?? {}
    const artistSet = [...new Set(chart.map(song => song.artist))]; // using Set to remove duplicated values

    const artistsToCache: Record<string, string> = {};
    
    await Promise.all(artistSet.map(async (artist) => {
        if (cachedKnownArtists[artist]) return;
        const results = await spotify.searchArtists(artist, { market: 'KR' })
        const artistName = results.body.artists?.items[0]?.name;
        if (artistName) artistsToCache[artist] = artistName;
    }));

    // cache artists
    if (Object.keys(artistsToCache).length > 0) kv.hset('knownartists', artistsToCache)
    kv.expire('knownartists', 60 * 60 * 24 * 7)
    const artists = {...cachedKnownArtists, ...artistsToCache}

    // search tracks
    const cachedSearchResults = (await kv.hgetall('cachedsearchresults')) as Record<string, string> ?? {}
    const resultsToCache: Record<string, string> = {}
    const trackURIs = await Promise.all(
        chart.map(async (song): Promise<string> => {
            // use cached search results if possible
            if (cachedSearchResults[song.title]) return cachedSearchResults[song.title]
            if (artists[song.artist]) {
                const results = await spotify.searchTracks(`track:${song.title} artist:${artists[song.artist]}`, { market: 'KR' })
                if (results.body.tracks && results.body.tracks.items.length > 0) {
                    const uri = results.body.tracks.items[0].uri
                    resultsToCache[song.title] = uri
                    return uri
                } // if not found, it will use alternative search query without artist filter
            }

            // find track on spotify
            const results = await spotify.searchTracks(song.title, { market: 'KR' })

            let track_uri = env.UNAVAILABLE_TRACK_URI
            if (results.body.tracks && results.body.tracks.items.length > 0) {
                const uri = results.body.tracks.items[0].uri
                track_uri = uri
                resultsToCache[song.title] = uri
            }
            return track_uri
        })
    )
    
    // cache track search results
    if (Object.keys(resultsToCache).length > 0) kv.hset('cachedsearchresults', resultsToCache)
    kv.expire('cachedsearchresults', 60 * 60 * 24 * 3)

    // replace tracks in playlist
    const maxRetries = 3

    for (let i = 0; i < maxRetries; i++) {
        try {
            await spotify.replaceTracksInPlaylist(env.PLAYLIST_ID, trackURIs);
            break;
        } catch (e) {
            if (i === maxRetries - 1) throw e;
            await new Promise(resolve => setTimeout(resolve, 4000));
        }
    }

    // update last update data
    kv.hset('lastupdate', { at: getCurrentTimestamp(), by: name })
    const currentCount = await kv.zincrby('topupdaters', 1, name)
    return {
        success: true,
        message: `갱신 성공! ${name} (${currentCount})`
    }
}

async function startUpdating(name: string) {
    setUpdatingState(true)
    let result: UpdateResult;
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
            message: '알 수 없는 오류가 발생했습니다. Spotify API 문제일 확률이 높습니다.'
        }
    }
    setUpdatingState(false, result)
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
    const fromLastCheck = getCurrentTimestamp() - Number(await kv.get('lastcheck'))

    const remainingTime = Math.floor(Number(env.UPDATE_CHECK_INTERVAL) - fromLastCheck)

    if (fromLastCheck < Number(env.UPDATE_CHECK_INTERVAL))
    return new Response(JSON.stringify({success: false, message: `플레이리스트가 이미 최근에 갱신되었습니다. ${remainingTime}초 뒤에 다시 시도하세요.`}), {status: 429, headers: { 'Retry-After': Math.floor(remainingTime).toString() }})

    if (updating) return new Response(JSON.stringify({success: false, message: "이미 다른 갱신 요청이 처리 중이에요. 잠시 기다려주세요."}), {status: 409})

    startUpdating(name)
    return new Response(JSON.stringify({success: true, message: "갱신 요청이 완료되었습니다. 곧 페이지가 새로 고침 됩니다."}))
}