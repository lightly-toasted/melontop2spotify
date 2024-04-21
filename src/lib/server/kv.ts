import { createClient } from '@vercel/kv';
import { KV_REST_API_URL, KV_REST_API_TOKEN } from '$env/static/private';

export const kv = createClient({
    url: KV_REST_API_URL,
    token: KV_REST_API_TOKEN,
});

export const kvKeys = {
    CACHED_SEARCH_RESULTS: 'cachedsearchresults',
    CACHED_ARTISTS: 'cachedartists',
    LAST_CHECK: 'lastcheck',
    LAST_UPDATE: 'lastupdate',
    TOP_UPDATERS: 'topupdaters',
    LATEST_MELON_CHART: 'latestmelonchart',
}