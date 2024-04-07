import { UPDATE_CHECK_INTERVAL } from '$env/static/private';
import { kv } from '$lib/server/kv';

interface LastUpdate {
    at: number;
    by: string;
    [key: string]: any;
}

export async function load() {
    const top3data = await kv.zrange('topupdaters', -3, -1, {withScores: true});
    top3data.reverse();
    
    let top3list = [];
    for (let i = 0; i < top3data.length; i += 2) {
        top3list.push({name: top3data[i + 1], count: top3data[i]});
    }

    const lastUpdate: LastUpdate = (await kv.hgetall('lastupdate')) ?? {at: 0, by: '', key: ''};

    const fromLastCheck = new Date().getTime() / 1000 - Number(await kv.get('lastcheck'))
    const updateAfter = fromLastCheck ? Math.ceil(Number(UPDATE_CHECK_INTERVAL) - fromLastCheck) : 0
    return {top3: top3list, lastUpdate: lastUpdate, updateAfter: updateAfter}
}