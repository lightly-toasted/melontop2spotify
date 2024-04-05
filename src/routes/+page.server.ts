import { kv } from '$lib/server/kv';

let count = 0
export async function load() {
    const top3data = await kv.zrange('topupdaters', -3, -1, {withScores: true});
    top3data.reverse();
    
    let top3list = [];
    for (let i = 0; i < top3data.length; i += 2) {
        top3list.push({name: top3data[i + 1], count: top3data[i]});
    }

    const lastUpdate = await kv.hgetall('lastupdate')
    count++
    console.log(count)

    return {top3: top3list, lastUpdate: lastUpdate}
}