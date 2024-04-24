<script lang="ts">
    type Response = {
        success: boolean,
        message: string,
    }

    let updateButton;
    let name: string = `익명${Math.floor(Math.random() * 100000000)}`;
    let isEditingName = false;

    import type { PageData } from "./$types";
    export let data: PageData;

    const rtf = new Intl.RelativeTimeFormat('kr', { numeric: 'auto' })
    
    function getLastUpdated() {
        const seconds = Math.floor(data.lastUpdate.at - new Date().getTime() / 1000);
        let time = '';
        if (-seconds < 60) {
            time = rtf.format(seconds, 'second');
        } else if (-seconds < 3600) {
            time = rtf.format(Math.floor(seconds / 60), 'minute');
        } else if (-seconds < 86400) {
            time = rtf.format(Math.floor(seconds / 3600), 'hour');
        } else {
            time = rtf.format(Math.floor(seconds / 86400), 'day');
        }
        return time;
    }

    let requestResponse: Response = {
        success: false,
        message: ''
    };

    async function requestUpdate(e: MouseEvent) {
        const button = e.target as HTMLButtonElement;
        button.disabled = true;

        const response = await fetch(`/api/request-update?name=${encodeURIComponent(name)}`);
        requestResponse = await response.json();
        if (requestResponse.success) {
            const response = await fetch(`/api/wait-for-update`);
            const updateData = await response.json();

            const urlParams = new URLSearchParams();
            if (!updateData.updating) {
                urlParams.append('success', updateData.result.success);
                urlParams.append('message', updateData.result.message);
            }
            location.search = urlParams.toString();
        }
    }

    import { onMount } from 'svelte';
    
    onMount(() => {
        const savedName = localStorage.getItem('name')
        if (savedName) {
            name = savedName
        } else {
            localStorage.setItem('name', name);
        }
        const urlParams = new URLSearchParams(location.search);
        const success = urlParams.get('success')
        const message = urlParams.get('message')

        if (message) {
            requestResponse = {
                success: success === 'true',
                message: message
            }
        }

        if (data.updateAfter > 0) {
            let remainingTime = data.updateAfter - 1
            updateButton!.disabled = true
            const interval = setInterval(() => {
                updateButton!.textContent = `${remainingTime}초 남음`
                remainingTime--
                if (remainingTime < 0) {
                    clearInterval(interval)
                    updateButton!.textContent = '갱신하기'
                    updateButton!.disabled = false
                }
            }, 1000)
        }
    });
</script>

<div class='px-4 md:px-15 xl:px-40 pt-20 md:pt-40'>
    <div class='flex flex-row xl:mr-8'>
        <div class='flex flex-col w-full :w-3/4'>
            <h1 class="font-black text-6xl md:text-7xl xl:text-8xl text-text"><span class="text-accent">멜론 차트</span>를 <br>Spotify에서.</h1>
            <iframe class="mt-8 rounded-2xl md:hidden" src="https://open.spotify.com/embed/playlist/4cRo44TavIHN54w46OqRVc?utm_source=generator&theme=0" width="100%" height="165" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" title="playlist"></iframe>
            <h2 class="text-4xl mt-5 md:mt-10 text-text font-semibold">마지막 갱신: {data.lastUpdate.by} - {getLastUpdated()}</h2>
            <div data-nosnippet class="flex flex-row mt-4">
                {#if !isEditingName}
                <p class="text-text">이 브라우저에서 플레이리스트를 갱신하면 <span class="inline-block"><button class="font-bold underline underline-offset-4 decoration-dotted" on:click={()=>isEditingName = true}>✎{name}</button>로 표시됩니다.</span></p>
                {:else}
                <input bind:value={name} class="border-2 border-gray-400 rounded px-2 py-1 text-background" maxlength="16" placeholder="새 이름 입력" />
                <button class="ml-2 bg-primary rounded px-4 py-1 text-background" on:click={() => {isEditingName = false; localStorage.setItem('name', name);}}>저장</button>
                <button class="ml-2 border-2 border-gray-400 rounded px-1 md:px-4 py-1 text-text" on:click={() => isEditingName = false}>취소</button>
                {/if}
            </div>
            <hr class="my-4 mr-36">
            <h3 data-nosnippet class="text-text font-bold text-xl">TOP 3 갱신 횟수</h3>
            {#each data.top3 as member, i}
            <p data-nosnippet class="text-text"><b>#{i + 1}</b> {member.name} ({member.count})</p>
            {/each}
            <div class='flex flex-row mt-12 space-x-4 mb-8'>
                <a href="https://open.spotify.com/playlist/4cRo44TavIHN54w46OqRVc?si=108f413accd44043" class="border-2 border-gray-400 rounded px-10 py-3 text-text">플레이리스트 듣기</a>
                <button bind:this={updateButton} on:click={requestUpdate} class="bg-primary rounded w-max md:w-auto px-5 md:px-10 py-3 text-background disabled:grayscale transition">갱신하기</button>
            </div>
            {#if requestResponse.message}
            <small data-success={requestResponse.success} class="text-xs text-red-300 data-[success=true]:text-green-300">{requestResponse.success ? '☑' : '☒'} {requestResponse.message}</small>
            {/if}
            <p class="flex items-center mt-3 space-x-1.5 underline"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" viewBox="0 0 16 16">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"/>
              </svg><a href="https://github.com/lightly-toasted/melontop2spotify" class="text-text text-sm">lightly-toasted/melontop2spotify</a></p>
        </div>
        <iframe class="mt-15 transform skew-y-3 ml-0 xl:ml-6 rounded-2xl shadow-[40px_-6px_20px_0px_rgba(0,0,0,0.5)] hidden md:block" src="https://open.spotify.com/embed/playlist/4cRo44TavIHN54w46OqRVc?utm_source=generator&theme=0" width="60%" height="593" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" title="playlist"></iframe>
    </div>
</div>
