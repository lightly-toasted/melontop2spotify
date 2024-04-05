import { spotify } from '$lib/server/spotify';
import { REDIRECT_URI } from '$env/static/private';
import type { LoadEvent } from '@sveltejs/kit';

interface Params {
    code?: string;
    [key: string]: string | undefined;
}

export async function load({ url }: LoadEvent<Params>) {
    if (!REDIRECT_URI) return { error: '환경 변수 REDIRECT_URI가 잘못되었습니다.' }

    spotify.setRedirectURI(REDIRECT_URI)

    const data: { authUrl: string, refreshToken?: string } = { authUrl: spotify.createAuthorizeURL(['playlist-read-private', 'playlist-modify-public', 'playlist-modify-private'], '') }
    const code = url.searchParams.get('code');
    if (code) try {
        const result = await spotify.authorizationCodeGrant(code);

        data.refreshToken = result.body.refresh_token;
    } catch (error) {
        return { error: (error as Error).message };
    }
    
    return data;
}