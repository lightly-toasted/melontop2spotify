import type { RequestHandler } from '@sveltejs/kit';
import * as env from '$env/static/private';
import axios from 'axios';
import { parse } from 'node-html-parser';
import { kv } from '$lib/server/kv';
import { spotify } from '$lib/server/spotify';
import { isUpdating, setUpdatingState } from '$lib/server/updating-state';
import md5 from 'md5';

function replaceDatetimePlaceholders(text: string) {
    const newDate = new Date()
    const formattedDate = new Intl.DateTimeFormat('ko-KR', {year: '2-digit', month: '2-digit', day: '2-digit', timeZone: 'Asia/Seoul'}).format(new Date(newDate))
    const formattedTime = new Intl.DateTimeFormat('ko-KR', {hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Seoul'}).format(new Date(newDate))
    
    return text.replace('%DATE%', formattedDate).replace('%TIME%', formattedTime);
}

function getCurrentTimestamp() {
    return new Date().getTime() / 1000
}

const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36"
}

async function updatePlaylist(name: string) {
    // check 
    kv.set('lastcheck', getCurrentTimestamp())

    const response = await axios.get(env.MELON_URL, { headers })

    const root = parse(response.data);
    const chart: string[] = [];

    const songs = root.querySelectorAll('.lst50, .lst100');
    songs.forEach(song => {
        const title = song.querySelector('.ellipsis.rank01')?.text.trim()!;
        chart.push(title);
    });

    const chartHash = md5(chart.join(''));
    if (await kv.get('latestmelonchart') == chartHash) return setUpdatingState(false)
    await kv.set('latestmelonchart', chartHash)
    const refreshData = await spotify.refreshAccessToken()
    spotify.setAccessToken(refreshData.body.access_token)

    let promises: Promise<void>[] = []
    const trackURIs = new Array(100).fill(null);

    async function getTrackURI(title: string) {
        const results = await spotify.searchTracks(title, { limit: 1 })
        let track_uri = env.UNAVAILABLE_TRACK_URI
        if (results.body.tracks && results.body.tracks.items.length > 0) track_uri = results.body.tracks.items[0].uri
        return track_uri
    }

    chart.forEach(title => {
        const index = promises.length;
        promises.push(getTrackURI(title).then(uri => {
            console.log(uri)
            trackURIs[index] = uri
        }));
    })

    await Promise.all(promises)

    for (let retries = 0; retries < 5; retries++) {
        try {
            await spotify.replaceTracksInPlaylist(env.PLAYLIST_ID, trackURIs);
            break;
        } catch (error) {
            console.table((error as Error))
            console.log(`갱신 중 오류가 발생했습니다. ${retries + 1}/5회 다시 시도 중...`)
        }
        if (retries === 4) {
            console.log('갱신 실패!')
            return setUpdatingState(false);
        }
    }

    const newPlaylistName = replaceDatetimePlaceholders(env.PLAYLIST_NAME)
    const newPlaylistDesc = replaceDatetimePlaceholders(env.PLAYLIST_DESC)

    await spotify.changePlaylistDetails(env.PLAYLIST_ID, { name: newPlaylistName, description: newPlaylistDesc })

    kv.hset('lastupdate', { at: getCurrentTimestamp(), by: name })
    kv.zincrby('topupdaters', 1, name)
    return setUpdatingState(false)
}





export const POST: RequestHandler = async ({ request }) => {
    const data = await request.json()
    const name = data.name ?? `익명${Math.floor(Math.random() * 100000000)}`
    
    if (name.length < 1) return new Response(JSON.stringify({success: false, message: "☒ 이름은 최소 1자 이상이어야 합니다."}), {status: 400});
    if (name.length > 16) return new Response(JSON.stringify({success: false, message: "☒ 이름은 최대 16자 이하이어야 합니다."}), {status: 400});

    const nameRegex = /^[A-Za-z0-9ㄱ-ㅎ가-힣]+$/;
    if (!nameRegex.test(name)) {
        return new Response(JSON.stringify({success: false, message: "☒ 이름은 영문, 한글, 숫자만 포함해야 합니다."}), {status: 400});
    }

    const blacklistedWords = ['도박', '카지노', '베팅'];
    for (let word of blacklistedWords) {
        if (name.includes(word)) {
            return new Response(JSON.stringify({success: false, message: `☒ 이름에 금지된 단어 '${word}' 가 포함되어 있습니다.`}), {status: 400});
        }
    }

    const fromLastCheck = getCurrentTimestamp() - Number(await kv.get('lastcheck'))

    const remainingTime = Math.floor(Number(env.UPDATE_CHECK_INTERVAL) - fromLastCheck)

    if (fromLastCheck < Number(env.UPDATE_CHECK_INTERVAL))
    return new Response(JSON.stringify({success: false, message: `☒ 플레이리스트가 이미 최근에 갱신되었습니다. ${remainingTime}초 뒤에 다시 시도하세요.`}), {status: 429, headers: { 'Retry-After': Math.floor(remainingTime).toString() }})

    if (isUpdating()) return new Response(JSON.stringify({success: false, message: "☒ 이미 다른 갱신 요청이 처리 중이에요. 잠시 기다려주세요."}), {status: 409})

    setUpdatingState(true)
    updatePlaylist(name)
    return new Response(JSON.stringify({success: true, message: "☑ 갱신 요청이 완료되었습니다. 곧 페이지가 새로 고침 됩니다."}))
}