# melontop2spotify
[한글](README.md) | **English**
> [!NOTE]
> This project is no longer actively maintained. The same service will be provided in [lightly-toasted/chart2playlist](https://github.com/lightly-toasted/chart2playlist), stay tuned!

## Contributors
- [x5tr](https://github.com/x5tr) - 🇰🇷 original idea, korean ex-maintainer of this project, did website design (not active atm)
- [lightly-toasted](https://github.com/lightly-toasted) - the only maintainer of this project, improved music searching

## Self-hosting
> [!WARNING]  
> Self-hosted instances are not fully supported and unstable for now.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Flightly-toasted%2Fmelontop2spotify&env=CLIENT_ID,CLIENT_SECRET,REFRESH_TOKEN,PLAYLIST_ID&envDescription=Read%20README.md&envLink=https%3A%2F%2Fgithub.com%2Flightly-toasted%2Fmelontop2spotify%3Ftab%3Dreadme-ov-file%23environment-variables&project-name=melontop2spotify&repository-name=melontop2spotify)

### Required Environment Variables
- `CLIENT_ID`: Spotify API client ID for your application. (required)
- `CLIENT_SECRET`: Spotify API client secret for your application. (required)
- `REFRESH_TOKEN`: A token used to refresh the authentication of your Spotify API session. Use [/getting-refresh-token](src/routes/getting-refresh-token/)
- `REDIRECT_URI`: The URI Spotify will redirect to after a successful login. Used in the authentication process. (required for [/getting-refresh-token](src/routes/getting-refresh-token/))

- `KV_REST_API_URL`: The URL for the Vercel KV store API.
- `KV_REST_API_TOKEN`: The authentication token for accessing the Vercel KV store API.

- `PLAYLIST_ID`: The Spotify ID for the playlist where tracks will be added.

### Optional Environment Variables

- `PLAYLIST_NAME`: The name of the Spotify playlist, supports placeholders. (`%DATE%`, `%DATE_6DIGIT%`, `%TIME%`)
- `PLAYLIST_DESC`: A description for the playlist, supports placeholders.
- `UNAVAILABLE_TRACK_URI`: The Spotify URI to use for tracks that are not available on Spotify.

- `MELON_URL`: The URL to fetch the Melon TOP 100 chart data from.

- `UPDATE_CHECK_INTERVAL`: The interval in seconds between checks for updates to the Melon chart.
- `RETRY_DELAY`: The number of seconds to wait before retrying update after a failure.
- `UPDATE_WHEN_CHART_NOT_CHANGED`: A boolean to decide whether to update the playlist even if the Melon chart has not changed.
