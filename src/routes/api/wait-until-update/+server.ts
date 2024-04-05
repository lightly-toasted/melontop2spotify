import type { RequestHandler } from '@sveltejs/kit';
import { isUpdating } from '$lib/server/updating-state';

export const POST: RequestHandler = async ({ request }) => {
    const data = await request.json()
    const timeout = data.timeout ?? 10000

    const start = Date.now();
    while (isUpdating()) {
        if (Date.now() - start > timeout) {
            break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    return new Response(JSON.stringify({updating: isUpdating()}));
}