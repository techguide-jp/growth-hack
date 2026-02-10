<script lang="ts">
    import { page } from "$app/stores";
    import { getProject, getUser } from "$lib/stores/mock";
    import ProjectTabs from "$lib/components/projects/ProjectTabs.svelte";
    import SupportPanel from "$lib/components/projects/SupportPanel.svelte";
    import ReactionBar from "$lib/components/shared/ReactionBar.svelte";
    import { Github, Globe, ExternalLink, Calendar } from "lucide-svelte";
    import { formatDistanceToNow } from "date-fns";
    import { ja } from "date-fns/locale";

    $: projectId = $page.params.id ?? "";
    $: projectStore = getProject(projectId);
    $: project = $projectStore;
    $: ownerStore = project ? getUser(project.ownerId) : null;
    $: owner = ownerStore ? $ownerStore : null;

    let activeTab = "overview";
</script>

{#if project}
    <!-- Hero Section -->
    <div class="bg-white border-b border-gray-200 -mt-8 mb-8 pb-8 pt-12">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex flex-col md:flex-row gap-8">
                <!-- Main Screenshot -->
                <div
                    class="w-full md:w-1/2 aspect-video bg-gray-100 rounded-xl overflow-hidden shadow-sm relative"
                >
                    {#if project.images.length > 0}
                        <img
                            src={project.images[0]}
                            alt=""
                            class="w-full h-full object-cover"
                        />
                    {:else}
                        <div
                            class="flex items-center justify-center h-full text-gray-400 font-bold"
                        >
                            NO IMAGE
                        </div>
                    {/if}
                </div>

                <!-- Info -->
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                        <span
                            class="px-2 py-1 rounded text-xs font-bold bg-indigo-100 text-indigo-700 uppercase tracking-widest"
                            >{project.status}</span
                        >
                        <span class="text-sm text-gray-500 flex items-center">
                            <Calendar class="w-4 h-4 mr-1" /> updated {formatDistanceToNow(
                                new Date(project.updatedAt),
                                { addSuffix: true, locale: ja },
                            )}
                        </span>
                    </div>

                    <h1 class="text-3xl font-extrabold text-gray-900 mb-4">
                        {project.title}
                    </h1>
                    <p class="text-lg text-gray-600 mb-6">{project.summary}</p>

                    <!-- Owner -->
                    <a
                        href={owner ? `/users/${owner.id}` : "#"}
                        class="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-lg inline-flex hover:bg-gray-100 transition-colors"
                    >
                        <img
                            src={owner?.avatarUrl}
                            alt=""
                            class="w-10 h-10 rounded-full"
                        />
                        <div>
                            <div class="text-xs text-gray-500">Created by</div>
                            <div class="font-bold text-gray-900">
                                {owner?.name || "Unknown"}
                            </div>
                        </div>
                    </a>

                    <!-- Links -->
                    <div class="flex gap-3">
                        {#if project.publicUrl}
                            <a
                                href={project.publicUrl}
                                target="_blank"
                                class="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition"
                            >
                                <Globe class="w-4 h-4" /> サイトを見る
                            </a>
                        {/if}
                        {#if project.repoUrl}
                            <a
                                href={project.repoUrl}
                                target="_blank"
                                class="flex items-center justify-center gap-2 bg-gray-800 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-gray-900 transition"
                            >
                                <Github class="w-4 h-4" /> GitHub
                            </a>
                        {/if}
                    </div>
                </div>
            </div>

            <!-- Reactions -->
            <div class="mt-6">
                <ReactionBar targetId={project.id} targetType="project" />
            </div>
        </div>
    </div>

    <!-- Content Tabs -->
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <ProjectTabs bind:activeTab />

        <div class="min-h-[300px]">
            {#if activeTab === "overview"}
                <div class="prose max-w-none text-gray-800">
                    <h3 class="text-xl font-bold mb-4">詳細説明</h3>
                    <p class="whitespace-pre-wrap">{project.description}</p>

                    <h3 class="text-xl font-bold mt-8 mb-4">
                        使用技術（タグ）
                    </h3>
                    <div class="flex gap-2">
                        {#each project.tags as tag}
                            <span
                                class="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-700"
                                >#{tag}</span
                            >
                        {/each}
                    </div>
                </div>
            {:else if activeTab === "support"}
                <SupportPanel {project} />
            {:else}
                <div
                    class="flex flex-col items-center justify-center h-40 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl"
                >
                    <span class="font-bold text-lg mb-1">Coming Soon</span>
                    <span class="text-sm"
                        >"{activeTab}" タブは現在開発中です (Mock)</span
                    >
                </div>
            {/if}
        </div>
    </div>
{:else}
    <div class="p-8 text-center">
        <h1 class="text-2xl font-bold text-gray-400">Project Not Found</h1>
        <a href="/projects" class="text-indigo-600 hover:underline mt-4 block"
            >一覧に戻る</a
        >
    </div>
{/if}
