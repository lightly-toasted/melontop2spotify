<script lang="ts">
    type Response = {
        success: boolean,
        message: string,
    }

    type LastUpdate = {
        by: string,
        at: number
    }

    type ServerData = {
        top3: { name: string, count: number }[],
        lastUpdate: LastUpdate
    }

    let name: string = `익명${Math.floor(Math.random() * 100000000)}`;
    let isEditingName = false;
    let editError = '';

    export let data: ServerData;

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
        // const button = e.target as HTMLButtonElement;
        // button.disabled = true;

        const response = await fetch(`/api/request-update`, {
			method: 'POST',
			body: JSON.stringify({ name: name }),
			headers: {
				'Content-Type': 'application/json'
			}
		});
        requestResponse = await response.json();
        if (requestResponse.success) {
            await fetch(`/api/wait-until-update`, {method: 'POST', body: '{}'});
            setTimeout(() => {
                location.reload();
            }, 2000);
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
    });
</script>

<div class='px-4 md:px-15 xl:px-40 pt-20 md:pt-40'>
    <div class='flex flex-row xl:mr-8'>
        <div class='flex flex-col w-full :w-3/4'>
            <h1 class="font-black text-6xl md:text-7xl xl:text-8xl text-text"><span class="text-accent">멜론 차트</span>를 <br>Spotify에서.</h1>
            <iframe class="mt-8 rounded-2xl md:hidden" src="https://open.spotify.com/embed/playlist/4cRo44TavIHN54w46OqRVc?utm_source=generator&theme=0" width="100%" height="165" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" title="playlist"></iframe>
            <h2 class="text-4xl mt-5 md:mt-10 text-text font-semibold">마지막 갱신:<br>{data.lastUpdate.by} - {getLastUpdated()}</h2>
            <div class="flex flex-row mt-4">
                {#if !isEditingName}
                <p class="text-text">이 브라우저에서 플레이리스트를 갱신하면 <button class="font-bold underline underline-offset-4 decoration-dotted" on:click={()=>isEditingName = true}>✎{name}</button>로 표시됩니다.</p>
                {:else}
                <input bind:value={name} class="border-2 border-gray-400 rounded px-2 py-1 text-background" maxlength="16" placeholder="새 이름 입력" />
                <button class="ml-2 bg-primary rounded px-4 py-1 text-background" on:click={() => {isEditingName = false; localStorage.setItem('name', name);}}>저장</button>
                <button class="ml-2 border-2 border-gray-400 rounded px-4 py-1 text-text" on:click={() => isEditingName = false}>취소</button>
                {/if}
            </div>
            <hr class="my-4 mr-36">
            <h3 class="text-text font-bold text-xl">TOP 3 갱신 횟수</h3>
            {#each data.top3 as member, i}
            <p class="text-text"><b>#{i + 1}</b> {member.name} ({member.count})</p>
            {/each}
            <div class='flex flex-row mt-12 space-x-4'>
                <a href="https://open.spotify.com/playlist/4cRo44TavIHN54w46OqRVc?si=108f413accd44043" class="border-2 border-gray-400 rounded px-10 py-3 text-text">플레이리스트 듣기</a>
                <button on:click={requestUpdate} class="bg-primary rounded px-10 py-3 text-background disabled:grayscale transition">갱신하기 (오류!)</button>
            </div>
            <small data-success={requestResponse.success} class="mt-8 text-xs text-red-300 data-[success=true]:text-green-300">{requestResponse.message}</small>
        </div>
        <iframe class="mt-15 transform skew-y-3 ml-0 xl:ml-6 rounded-2xl shadow-[40px_-6px_20px_0px_rgba(0,0,0,0.5)] hidden md:block" src="https://open.spotify.com/embed/playlist/4cRo44TavIHN54w46OqRVc?utm_source=generator&theme=0" width="60%" height="570" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" title="playlist"></iframe>
    </div>
</div>
