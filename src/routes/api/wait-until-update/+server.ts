import type { RequestHandler } from '@sveltejs/kit';
import { updateResult, updating } from '$lib/server/updating-state';

export const GET: RequestHandler = async ({ request }) => {
    const url = new URL(request.url);

    const timeoutParam = url.searchParams.get('timeout');
    const timeout = timeoutParam ? Number(timeoutParam) : 31000;
    
    const start = Date.now();
    while (updating) {
        if (Date.now() - start > timeout) {
            break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    return new Response(JSON.stringify({updating: updating, result: updateResult}));
}