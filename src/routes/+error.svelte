<div class="flex items-center justify-center h-screen flex-col space-y-2 text-left">
    <h1 class="text-8xl font-black text-text">404 오류!! 😱</h1>
    <p class="text-text py-4">찾으시는 페이지가 존재하지 않습니다.<br></p>
    <div class="flex-row">
        <a href="/" class="bg-primary rounded px-10 py-1 text-background">홈</a>
        <button on:click={()=>{history.back()}} class="border-2 border-gray-400 rounded px-10 py-1 text-text">돌아가기</button>
    </div>
    <small class=" text-gray-400">페이지 관리자가 아닌 경우 나가세요.</small>
</div>