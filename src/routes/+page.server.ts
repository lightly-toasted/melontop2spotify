import { UPDATE_CHECK_INTERVAL } from '$env/static/private';
import { kv, kvKeys } from '$lib/server/kv';

export async function load() {
    const top3data = await kv.zrange(kvKeys.TOP_UPDATERS, -3, -1, {withScores: true});
    top3data.reverse();
    
    let top3 = [];
    for (let i = 0; i < top3data.length; i += 2) {
        top3.push({name: top3data[i + 1], count: top3data[i]});
    }

    const lastUpdate: {
        at: number;
        by: string;
    } = (await kv.hgetall(kvKeys.LAST_UPDATE)) ?? {at: 0, by: ''};

    const fromLastCheck = Number(await kv.get(kvKeys.NEXT_UPDATE)) - new Date().getTime() / 1000
    const updateAfter = Math.ceil(Number(UPDATE_CHECK_INTERVAL) - fromLastCheck)
    return {top3, lastUpdate, updateAfter}
}