export const overrides: {
    tracks: { [key: string]: string | null },
    artists: { [key: string]: string | null }
} = {
    tracks: {
        // 여기의 트랙은 Spotify 검색 과정을 건너뛰고 대신 입력된 URI 값을 사용합니다.
        // "멜론 트랙 이름": "스포티파이 URI"

        // ex)
        // "홀씨": "spotify:track:0UTtK6hregIBOsefavRI26"

        // 특정 트랙을 플레이리스트에서 없애려면 스포티파이 URI 대신 null 값을 할당합니다.
        // ex)
        // "홀씨": null
        "그대만 있다면 (여름날 우리 X 너드커넥션 (Nerd Connection))": "spotify:track:3TQHPUEVdvdq8ejwEcHUlL"
    },
    artists: {
        // 여기의 아티스트는 스포티파이 검색 과정을 건너뛰고 대신 여기에 할당된 아티스트 이름을 사용합니다.
        // "멜론 아티스트 이름": "스포티파이 아티스트 이름"

        // ex)
        // "아이유": "아이유"

        // 특정 아티스트의 트랙을 플레이리스트에서 없애려면 아티스트 이름 대신 null 값을 할당합니다.
        // ex)
        // "아이유": null
        "아이유": "아이유"
    }
};
