<script lang="ts">
    import {
        timelinePosts,
        projects,
        userPreferences,
        currentUser,
    } from "$lib/stores/mock";
    import TimelinePostCard from "$lib/components/timeline/TimelinePostCard.svelte";
    import ProjectCard from "$lib/components/projects/ProjectCard.svelte";
    import { Rocket, Plus, Search } from "lucide-svelte";

    // Sort logic based on prefs
    $: myPrefs = $userPreferences.find((p) => p.userId === $currentUser?.id);
    $: focusModes = myPrefs?.focusModes || [
        "post",
        "support",
        "collab",
        "event",
    ];

    // Latest timeline
    $: recentPosts = [...$timelinePosts]
        .sort(
            (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
        )
        .slice(0, 5);

    // Latest projects
    $: recentProjects = [...$projects]
        .sort(
            (a, b) =>
                new Date(b.updatedAt).getTime() -
                new Date(a.updatedAt).getTime(),
        )
        .slice(0, 3);

    // Dynamic Section Ordering
    // If 'post' is primary, show Timeline first. If 'support', show Projects first.
    // For MVP, just show sections.
</script>

<div class="space-y-12">
    <!-- Hero / CTA -->
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

    <!-- My Focus -->
    {#if myPrefs}
        <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold text-gray-800">
                あなたの現在のモード
            </h2>
            <a
                href="/onboarding"
                class="text-sm text-indigo-600 hover:underline">変更する</a
            >
        </div>
        <div class="flex gap-2 -mt-8 mb-8">
            {#each focusModes as m}
                <span
                    class="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium border border-indigo-100 uppercase"
                    >{m}</span
                >
            {/each}
        </div>
    {/if}

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main Feed -->
        <div class="lg:col-span-2 space-y-8">
            <!-- Latest Posts -->
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
                <div class="space-y-4">
                    {#each recentPosts as post (post.id)}
                        <TimelinePostCard {post} />
                    {/each}
                </div>
            </section>
        </div>

        <!-- Right Column -->
        <div class="space-y-8">
            <!-- New Projects -->
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
                <div class="space-y-4">
                    {#each recentProjects as project (project.id)}
                        <ProjectCard {project} />
                    {/each}
                </div>
            </section>
        </div>
    </div>
</div>
