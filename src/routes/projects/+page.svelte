<script lang="ts">
    import { projects } from "$lib/stores/mock";
    import ProjectCard from "$lib/components/projects/ProjectCard.svelte";
    import { Search, Filter } from "lucide-svelte";

    // Sort logic (Mock)
    let sort = "updated_desc";
    $: sortedProjects = [...$projects].sort((a, b) => {
        // Default updated
        return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
    });
</script>

<div class="max-w-7xl mx-auto">
    <!-- Header & Controls -->
    <div
        class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
    >
        <h1 class="text-3xl font-bold text-gray-900">プロジェクトを探す</h1>

        <div class="flex gap-2">
            <div class="relative">
                <Search
                    class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                />
                <input
                    type="text"
                    placeholder="キーワードで検索..."
                    class="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 w-full md:w-64"
                />
            </div>
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
