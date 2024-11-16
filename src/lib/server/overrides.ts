// 여기의 아티스트 및 트랙은 검색 과정을 건너뛰고 대신 여기에 입력된 URI를 사용합니다.

// 트랙, 아티스트의 스포티파이 URI를 복사하려면 CTRL 을 누른 상태로 마우스 우클릭 -> 공유 -> Spotify URI 복사를 누르세요.
// https://community.spotify.com/t5/FAQs/What-s-a-Spotify-URI/ta-p/919201

export const overrides: {
    tracks: { [key: string]: string | null },
    artists: { [key: string]: string | null }
} = {
    tracks: {
        // "멜론 트랙 이름 - 멜론 아티스트 이름": "스포티파이 URI",
        // ex)
        // "홀씨 - 아이유": "spotify:track:0UTtK6hregIBOsefavRI26",

        // 특정 트랙을 플레이리스트에서 없애려면 스포티파이 URI 대신 null 값을 할당합니다.
        // ex)
        // "홀씨 - 아이유": null,
        "그대만 있다면 (여름날 우리 X 너드커넥션 (Nerd Connection)) - 너드커넥션 (Nerd Connection)": "spotify:track:3TQHPUEVdvdq8ejwEcHUlL",
        "파이팅 해야지 (Feat. 이영지) - 부석순 (SEVENTEEN)": "spotify:track:7eBpUuPnDTfbeP1P4P93CS",
        "Time Machine (Feat. 태연, 마크) - 도영 (DOYOUNG)": "spotify:track:3zA99edHgR3TIOeUJapvGY",
        "SPOT! (feat. JENNIE) - 지코 (ZICO)": "spotify:track:1SS0WlKhJewviwEDZ6dWj0",
        "청춘찬가 - 세븐틴 (SEVENTEEN)": "spotify:track:1XvOEvWtfa879Wk1wKHZ1M",
        "그랬나봐 - 유회승 (엔플라잉)": "spotify:track:4H0jGKPyORcxowWlXgSdth",
        "한 페이지가 될 수 있게 - DAY6 (데이식스)": "spotify:track:0btLaqWlXsOWLcpjE1jmIk",
        "클락션 (Klaxon) - (여자)아이들": "spotify:track:294hRgOqnGW2BemqP8D35X",
        "멈추지 않아 - PLAVE": "spotify:track:1riEr6o3obQxrQRFmD9Sed"
    },
    artists: {
        // "멜론 아티스트 이름": "스포티파이 아티스트 이름"
        // ex)
        // "아이유": "spotify:artist:3HqSLMAZ3g3d5poNaI7GOU"

        // 특정 아티스트의 트랙을 플레이리스트에서 없애려면 아티스트 이름 대신 null 값을 할당합니다.
        // ex)
        // "아이유": null
        "아이유": "spotify:artist:3HqSLMAZ3g3d5poNaI7GOU",
    }
};
