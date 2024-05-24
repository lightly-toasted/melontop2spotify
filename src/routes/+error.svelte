<script>
    import { page } from '$app/stores';
</script>

<div class="flex items-center justify-center h-screen flex-col space-y-2 text-center">
    <h1 class="text-8xl font-black text-text">오류!! 😱</h1>
    <p class="text-text">{$page.status} {$page.error?.message}... 고양이도 이해 못하는 페이지입니다ㅡㅡ!! 🐈🙀</p>
    <img alt="🐈" src="https://cataas.com/cat?width=384&height=224" class="my-2 w-96 min-h-56 bg-gradient-to-r from-yellow-200 to-orange-200" />
    <div class="flex-row">
        <a href="/" class="bg-primary rounded px-10 py-1 text-background">처음으로</a>
        <button on:click={()=>{history.back()}} class="border-2 border-gray-400 rounded px-10 py-1 text-text">돌아가기</button>
    </div>
</div>