<script lang="ts">
    import { timelinePosts } from "$lib/stores/mock";
    import TimelineComposer from "$lib/components/timeline/TimelineComposer.svelte";
    import TimelinePostCard from "$lib/components/timeline/TimelinePostCard.svelte";

    // Sort by createdAt desc
    $: posts = $timelinePosts.sort(
        (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    let activeTab = "all"; // all, following, project
</script>

<div class="flex gap-8">
    <!-- Left Column: Main Feed -->
    <div class="flex-1 max-w-2xl">
        <div class="mb-6 flex items-center justify-between">
            <h1 class="text-2xl font-bold">タイムライン</h1>

            <!-- Filter Tabs (Visual Only for MVP) -->
            <div class="flex bg-gray-100 p-1 rounded-lg">
                <button
                    class="px-3 py-1 text-sm font-medium rounded {activeTab ===
                    'all'
                        ? 'bg-white shadow'
                        : 'text-gray-500'}"
                    on:click={() => (activeTab = "all")}>全体</button
                >
                <button
                    class="px-3 py-1 text-sm font-medium rounded {activeTab ===
                    'following'
                        ? 'bg-white shadow'
                        : 'text-gray-500'}"
                    on:click={() => (activeTab = "following")}
                    >フォロー中</button
                >
            </div>
        </div>

        <TimelineComposer />

        {#each posts as post (post.id)}
            <TimelinePostCard {post} />
        {/each}

        {#if posts.length === 0}
            <div class="text-center py-12 text-gray-500">
                投稿がありません。最初の投稿をしてみましょう！
            </div>
        {/if}
    </div>

    <!-- Right Column: Sidebar (Mock) -->
    <div class="hidden lg:block w-80 space-y-6">
        <!-- Active Events -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 class="font-bold text-gray-900 mb-3">開催中のイベント</h3>
            <div class="text-sm text-gray-500">
                現在開催中のイベントはありません。
            </div>
        </div>

        <!-- Recommended Users -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 class="font-bold text-gray-900 mb-3">おすすめユーザー</h3>
            <!-- Mock list -->
            <div class="space-y-3">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-full bg-indigo-100"></div>
                    <div class="text-sm font-medium">Alice</div>
                </div>
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-full bg-green-100"></div>
                    <div class="text-sm font-medium">Bob</div>
                </div>
            </div>
        </div>
    </div>
</div>
