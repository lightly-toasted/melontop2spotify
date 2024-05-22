import SpotifyWebApi from 'spotify-web-api-node'
import { CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN } from '$env/static/private';

export const spotify = new SpotifyWebApi({
    clientId: CLIENT_ID,
	clientSecret: CLIENT_SECRET,
    refreshToken: REFRESH_TOKEN,
})