<script lang="ts">
    let number = 10;
    let refreshToken = '';
    function pressContinue() {
        if (number > 1) return number--
        window.location.href = data.authUrl!;
    }
    function copyRefreshToken() {
        navigator.clipboard.writeText(refreshToken)
            .then(() => {
                alert('클립보드에 당신의 Refresh Token이 복사되었습니다.');
            })
            .catch(err => {
                console.error('복사 실패: ', err);
            });
    }

    import type { PageData } from "./$types";
    export let data: PageData;

    if (data.refreshToken) refreshToken = data.refreshToken
</script>

<div class="flex items-center justify-center h-screen flex-col space-y-2 text-center">
    <p class="text-2xl text-text">아래 버튼을 클릭하면 계정의 플레이리스트를 관리할 수 있는 Refresh Token이 이 페이지에 보여집니다.</p>
    {#if refreshToken}
    <p class="text-2xl text-text">Refresh Token: <span class="rounded bg-text hover:bg-transparent transition-colors">{refreshToken}</span> <button on:click={copyRefreshToken}>(복사하기)</button></p>
    {/if}
    <p class="font-bold text-2xl text-red-500">절대 Refresh Token을 다른 사람과 공유하지 마세요.</p>
    {#if !data.error}
    <div class="flex-row">
        <a href="/" class="bg-primary rounded px-10 py-1 text-background">나가기</a>
        <button class="border-2 border-gray-400 rounded px-10 py-1 text-text" on:click={pressContinue}>Authorize ({number})</button>
    </div>
    {:else}
    <p class="text-yellow-400">⚠ {data.error}</p>
    <a href="/getting-refresh-token" class="bg-primary rounded px-10 py-1 text-background">다시 시도</a>
    {/if}
    <small class=" text-gray-400">페이지 관리자가 아닌 경우 나가세요.</small>
</div>