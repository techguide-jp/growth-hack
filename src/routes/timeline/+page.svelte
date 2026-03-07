<script lang="ts">
    import TimelineComposer from "$lib/components/timeline/TimelineComposer.svelte";
    import TimelinePostCard from "$lib/components/timeline/TimelinePostCard.svelte";
    import type { PageProps } from "./$types";
    import type { TimelinePostView, TimelineScope } from "$lib/shared/timeline";

    let { data }: PageProps = $props();
</script>

<div class="flex gap-8">
    <div class="flex-1 max-w-2xl">
        <div class="mb-6 flex items-center justify-between">
            <h1 class="text-2xl font-bold">タイムライン</h1>

            <div class="flex bg-gray-100 p-1 rounded-lg">
                <a
                    href="/timeline?scope=global"
                    class={`px-3 py-1 text-sm font-medium rounded ${
                        data.scope === "global"
                            ? "bg-white shadow"
                            : "text-gray-500"
                    }`}
                >
                    全体
                </a>
                <a
                    href="/timeline?scope=following"
                    class={`px-3 py-1 text-sm font-medium rounded ${
                        data.scope === "following"
                            ? "bg-white shadow"
                            : "text-gray-500"
                    }`}
                >
                    フォロー中
                </a>
            </div>
        </div>

        <TimelineComposer projects={data.myProjects} />

        {#if data.scope === "following" && !data.canViewFollowing}
            <div
                class="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center"
            >
                <p class="text-sm text-gray-600">
                    フォロー中フィードを見るにはログインが必要です。
                </p>
                <a
                    href="/login?next=%2Ftimeline%3Fscope%3Dfollowing"
                    class="mt-4 inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                    ログインする
                </a>
            </div>
        {:else if data.posts.length > 0}
            {#each data.posts as post (post.id)}
                <TimelinePostCard {post} />
            {/each}
        {:else if data.scope === "following"}
            <div
                class="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center text-gray-500"
            >
                まだフォロー中の投稿がありません。
            </div>
        {:else}
            <div
                class="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center text-gray-500"
            >
                投稿がありません。最初の投稿をしてみましょう！
            </div>
        {/if}
    </div>

    <div class="hidden lg:block w-80 space-y-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 class="font-bold text-gray-900 mb-3">開催中のイベント</h3>
            <div class="text-sm text-gray-500">
                現在開催中のイベントはありません。
            </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 class="font-bold text-gray-900 mb-3">おすすめユーザー</h3>
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
