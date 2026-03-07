<script lang="ts">
    import { page } from "$app/state";
    import ProjectCard from "$lib/components/projects/ProjectCard.svelte";
    import TimelinePostCard from "$lib/components/timeline/TimelinePostCard.svelte";
    import type { PageProps } from "./$types";
    import type {
        ProjectHelpType,
        ProjectStage,
        ProjectStatus,
    } from "$lib/shared/domain";
    import type { TimelinePostView } from "$lib/shared/timeline";
    import { Rocket, Search } from "lucide-svelte";

    let { data }: PageProps = $props();

    const defaultFocusModes = ["post", "support", "collab", "event"];

    let focusModes = $derived(page.data.preferences?.focusModes ?? defaultFocusModes);
    let hasPreferences = $derived(Boolean(page.data.preferences));
</script>

<div class="space-y-12">
    <section
        class="text-center py-10 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl text-white shadow-xl"
    >
        <h1 class="text-3xl md:text-5xl font-extrabold mb-4">
            継続開発を、もっと楽しく。
        </h1>
        <p class="text-lg md:text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Growth
            Hachは、ハッカソン作品の開発をみんなで応援しあうコミュニティです。
            <br />進捗を投稿して、仲間を見つけよう。
        </p>
        <div class="flex flex-col sm:flex-row justify-center gap-4">
            <a
                href="/timeline"
                class="inline-flex items-center justify-center px-8 py-3 bg-white text-indigo-600 rounded-full font-bold text-lg hover:bg-gray-100 transition shadow-lg"
            >
                <Rocket class="w-5 h-5 mr-2" />
                進捗を投稿する
            </a>
            <a
                href="/projects"
                class="inline-flex items-center justify-center px-8 py-3 bg-indigo-500/30 text-white border border-white/30 rounded-full font-bold text-lg hover:bg-indigo-500/50 transition"
            >
                <Search class="w-5 h-5 mr-2" />
                作品を探す
            </a>
        </div>
    </section>

    {#if hasPreferences}
        <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold text-gray-800">
                あなたの現在のモード
            </h2>
            <a
                href="/settings"
                class="text-sm text-indigo-600 hover:underline">変更する</a
            >
        </div>
        <div class="flex gap-2 -mt-8 mb-8 flex-wrap">
            {#each focusModes as mode}
                <span
                    class="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium border border-indigo-100 uppercase"
                    >{mode}</span
                >
            {/each}
        </div>
    {/if}

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 space-y-8">
            <section>
                <div class="flex items-center justify-between mb-4">
                    <h2
                        class="text-2xl font-bold text-gray-900 flex items-center"
                    >
                        <Rocket class="w-6 h-6 mr-2 text-indigo-500" />
                        タイムライン
                    </h2>
                    <a
                        href="/timeline"
                        class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                        >もっと見る &rarr;</a
                    >
                </div>

                {#if data.recentPosts.length > 0}
                    <div class="space-y-4">
                        {#each data.recentPosts as post (post.id)}
                            <TimelinePostCard {post} />
                        {/each}
                    </div>
                {:else}
                    <div
                        class="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center text-gray-500"
                    >
                        まだ投稿がありません。最初の投稿をしてみましょう。
                    </div>
                {/if}
            </section>
        </div>

        <div class="space-y-8">
            <section>
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-bold text-gray-900">
                        新着プロジェクト
                    </h2>
                    <a
                        href="/projects"
                        class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                        >一覧 &rarr;</a
                    >
                </div>

                {#if data.recentProjects.length > 0}
                    <div class="space-y-4">
                        {#each data.recentProjects as project (project.id)}
                            <ProjectCard {project} />
                        {/each}
                    </div>
                {:else}
                    <div
                        class="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center text-gray-500"
                    >
                        まだ公開プロジェクトがありません。
                    </div>
                {/if}
            </section>
        </div>
    </div>
</div>
