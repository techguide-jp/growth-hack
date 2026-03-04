<script lang="ts">
    import { projects } from "$lib/stores/mock";
    import ProjectCard from "$lib/components/projects/ProjectCard.svelte";
    import { Search, Filter, Plus } from "lucide-svelte";

    // Sort logic (Mock)
    let sort = "updated_desc";
    $: sortedProjects = [...$projects].sort((a, b) => {
        // Default updated
        return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
    });
</script>

<div>
    <!-- Header -->
    <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900">プロジェクトを探す</h1>
        <p class="text-sm text-gray-600 mt-2">
            公開中の作品や開発中のプロジェクトを一覧で確認できます。気になる案件を開いて詳細を見たり、コラボ・応援・相談のきっかけをつくることができます。
        </p>
    </div>

    <!-- Controls -->
    <div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-8">
        <div class="relative flex-1 sm:max-w-xs">
            <Search
                class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            />
            <input
                type="text"
                placeholder="キーワードで検索..."
                class="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
        </div>
        <div class="flex items-center gap-2">
            <button
                class="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
                <Filter class="w-4 h-4" />
                フィルタ
            </button>
            <select
                bind:value={sort}
                class="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
            >
                <option value="updated_desc">更新順</option>
                <option value="newest">新規順</option>
                <option value="support">支援が多い順</option>
            </select>
            <a
                href="/projects/new"
                class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition whitespace-nowrap"
            >
                <Plus class="w-4 h-4" />
                新規作成
            </a>
        </div>
    </div>

    <!-- Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each sortedProjects as project (project.id)}
            <ProjectCard {project} />
        {/each}
    </div>

    {#if sortedProjects.length === 0}
        <div
            class="text-center py-20 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300"
        >
            プロジェクトが見つかりませんでした。
        </div>
    {/if}
</div>

