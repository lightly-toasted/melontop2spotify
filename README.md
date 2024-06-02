# melontop2spotify
**한글** | [English](README.en.md)
> [!NOTE]
> 이 프로젝트는 더 이상 적극적으로 유지 관리되지 않습니다. 곧 [lightly-toasted/chart2playlist](https://github.com/lightly-toasted/chart2playlist)에서 같은 기능을 제공할 예정이니 잠시 기다려주세요!

## 기여자
- [x5tr](https://github.com/x5tr) - 전 관리자로서 웹사이트 디자인을 담당했습니다. (현재 활동하지 않음)
- [lightly-toasted](https://github.com) - 이 프로젝트의 주요 관리자입니다.

## 자체 호스팅
> [!WARNING]
> 자체 호스팅된 인스턴스는 현재 완전히 지원되지 않으며 불안정합니다.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Flightly-toasted%2Fmelontop2spotify&env=CLIENT_ID,CLIENT_SECRET,REFRESH_TOKEN,PLAYLIST_ID&envDescription=Read%20README.md&envLink=https%3A%2F%2Fgithub.com%2Flightly-toasted%2Fmelontop2spotify%3Ftab%3Dreadme-ov-file%23environment-variables&project-name=melontop2spotify&repository-name=melontop2spotify)

### 필수 환경 변수
- `CLIENT_ID`: 스포티파이 API Client ID (필수)
- `CLIENT_SECRET`: 스포티파이 API Client Secret (필수)
- `REFRESH_TOKEN`: 스포티파이 API 세션의 인증을 새로 고치는 데 사용되는 토큰입니다. [/getting-refresh-token](src/routes/getting-refresh-token/)
- `REDIRECT_URI`:  [/getting-refresh-token](src/routes/getting-refresh-token/) 페이지를 사용하는데 필요함

- `KV_REST_API_URL`: Vercel KV의 API URL
- `KV_REST_API_TOKEN`: Vercel KV 인증 토큰

- `PLAYLIST_ID`: 스포티파이 플레이리스트 ID

### 선택적 환경 변수

- `PLAYLIST_NAME`: 스포티파이 플레이리스트의 이름입니다. 변수 `%DATE%`, `%DATE_6DIGIT%`, `%TIME%`를 이름에 사용할 수 있습니다.
- `PLAYLIST_DESC`: 플레이리스트의 설명으로 위 변수들을 사용할 수 있습니다.
- `UNAVAILABLE_TRACK_URI`: 트랙을 스포티파이에서 찾을 수 없을 때 대체할 트랙의 URI입니다.

- `MELON_URL`: 크롤링할 멜론 TOP100 차트의 URL입니다.

- `UPDATE_CHECK_INTERVAL`: 플레이리스트 재갱신 대기 시간(초)입니다.
- `RETRY_DELAY`: 갱신에 실패했을 때 재갱신 대기 시간(초)입니다.
- `UPDATE_WHEN_CHART_NOT_CHANGED`: 차트에 변경 사항이 없을 때 플레이리스트의 트랙을 갱신하지 않습니다. (true/false)