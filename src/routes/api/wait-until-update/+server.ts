import type { RequestHandler } from '@sveltejs/kit';
import { updateResult, updating } from '$lib/server/updating-state';

export const POST: RequestHandler = async ({ request }) => {
    const data = await request.json()
    const timeout = data.timeout ?? 31000

    const start = Date.now();
    while (updating) {
        if (Date.now() - start > timeout) {
            break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    return new Response(JSON.stringify({updating: updating, result: updateResult}));
}