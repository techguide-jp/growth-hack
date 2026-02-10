<script lang="ts">
    import { page } from "$app/stores";
    import {
        users,
        projects,
        timelinePosts,
        supportRecords,
        userPreferences,
    } from "$lib/stores/mock";
    import { FolderKanban, Rocket, Gift, Calendar } from "lucide-svelte";

    function formatDateTime(value: string) {
        return new Intl.DateTimeFormat("ja-JP", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(value));
    }

    const POST_TYPE_LABEL: Record<string, string> = {
        progress: "進捗",
        question: "相談",
        showcase: "見せびらかし",
    };

    $: userId = $page.params.id ?? "";
    $: profile = $users.find((user) => user.id === userId);
    $: userProjects = [...$projects]
        .filter((project) => project.ownerId === userId)
        .sort(
            (a, b) =>
                new Date(b.updatedAt).getTime() -
                new Date(a.updatedAt).getTime(),
        );
    $: recentPosts = [...$timelinePosts]
        .filter((post) => post.authorId === userId)
        .sort(
            (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
        )
        .slice(0, 5);
    $: focusModes =
        $userPreferences.find((pref) => pref.userId === userId)?.focusModes ?? [];

    $: projectIds = userProjects.map((project) => project.id);
    $: totalConfirmedSupport = $supportRecords
        .filter(
            (record) =>
                projectIds.includes(record.projectId) &&
                record.status === "confirmed",
        )
        .reduce((sum, record) => sum + record.amount, 0);
</script>

{#if profile}
    <div class="max-w-5xl mx-auto py-8 space-y-8">
        <section class="bg-white rounded-xl border border-gray-200 p-6">
            <div class="flex flex-col md:flex-row md:items-center gap-5">
                <img
                    src={profile.avatarUrl}
                    alt=""
                    class="w-20 h-20 rounded-full border border-gray-200"
                />
                <div class="flex-1">
                    <h1 class="text-3xl font-bold text-gray-900">{profile.name}</h1>
                    <p class="text-sm text-gray-500 mt-1">{profile.email}</p>
                    <div class="flex flex-wrap gap-2 mt-3">
                        {#each focusModes as mode}
                            <span
                                class="px-2.5 py-1 rounded-full text-xs bg-indigo-50 text-indigo-700 border border-indigo-100"
                            >
                                #{mode}
                            </span>
                        {/each}
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-3 text-center">
                    <div class="rounded-lg bg-gray-50 px-4 py-3 min-w-[120px]">
                        <div class="text-xl font-black text-gray-900">
                            {userProjects.length}
                        </div>
                        <div class="text-xs text-gray-500">Projects</div>
                    </div>
                    <div class="rounded-lg bg-gray-50 px-4 py-3 min-w-[120px]">
                        <div class="text-xl font-black text-gray-900">
                            ¥{totalConfirmedSupport.toLocaleString()}
                        </div>
                        <div class="text-xs text-gray-500">Confirmed Support</div>
                    </div>
                </div>
            </div>
        </section>

        <section class="bg-white rounded-xl border border-gray-200 p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <FolderKanban class="w-5 h-5 mr-2 text-indigo-600" />
                プロジェクト
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                {#each userProjects as project}
                    <a
                        href="/projects/{project.id}"
                        class="rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
                    >
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="font-bold text-gray-900">{project.title}</h3>
                            <span class="text-xs text-gray-400 uppercase">
                                {project.status}
                            </span>
                        </div>
                        <p class="text-sm text-gray-600 mb-3 line-clamp-2">
                            {project.summary}
                        </p>
                        <div class="text-xs text-gray-400">
                            更新: {formatDateTime(project.updatedAt)}
                        </div>
                    </a>
                {/each}
            </div>
            {#if userProjects.length === 0}
                <p class="text-sm text-gray-500">公開中のプロジェクトはありません。</p>
            {/if}
        </section>

        <section class="bg-white rounded-xl border border-gray-200 p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Rocket class="w-5 h-5 mr-2 text-indigo-600" />
                最近の投稿
            </h2>
            <div class="space-y-3">
                {#each recentPosts as post}
                    <article class="rounded-lg border border-gray-100 p-4 bg-gray-50/70">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs font-semibold text-indigo-600">
                                {POST_TYPE_LABEL[post.type]}
                            </span>
                            <span class="text-xs text-gray-400">
                                <Calendar class="w-3 h-3 inline-block mr-1" />
                                {formatDateTime(post.createdAt)}
                            </span>
                        </div>
                        {#if post.title}
                            <h3 class="font-bold text-gray-900 mb-1">{post.title}</h3>
                        {/if}
                        <p class="text-sm text-gray-700 line-clamp-2">{post.body}</p>
                    </article>
                {/each}
            </div>
            {#if recentPosts.length === 0}
                <p class="text-sm text-gray-500">投稿はまだありません。</p>
            {/if}
        </section>

        <section class="bg-white rounded-xl border border-gray-200 p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-2 flex items-center">
                <Gift class="w-5 h-5 mr-2 text-indigo-600" />
                応援導線（モック）
            </h2>
            <p class="text-sm text-gray-600">
                このユーザーのプロジェクト詳細ページからリアクション・コメント・支援記録の作成ができます。
            </p>
        </section>
    </div>
{:else}
    <div class="max-w-3xl mx-auto py-16 text-center">
        <h1 class="text-2xl font-bold text-gray-700 mb-3">
            ユーザーが見つかりませんでした
        </h1>
        <a href="/" class="text-indigo-600 hover:underline">ホームに戻る</a>
    </div>
{/if}
