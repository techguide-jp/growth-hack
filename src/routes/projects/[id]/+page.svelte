<script lang="ts">
    import ProjectTabs from "$lib/components/projects/ProjectTabs.svelte";
    import SupportPanel from "$lib/components/projects/SupportPanel.svelte";
    import ReactionBar from "$lib/components/shared/ReactionBar.svelte";
    import { Github, Globe, Calendar, Pencil } from "lucide-svelte";
    import { formatDistanceToNow } from "date-fns";
    import { ja } from "date-fns/locale";

    export let data: {
        canEdit: boolean;
        project: {
            id: string;
            ownerId: string;
            ownerName: string | null;
            ownerAvatarUrl: string | null;
            title: string;
            summary: string;
            description: string;
            publicUrl?: string;
            repoUrl?: string;
            demoUrl?: string;
            tags: string[];
            images: string[];
            status: "draft" | "published" | "archived";
            createdAt: string;
            updatedAt: string;
        };
    };

    const project = data.project;
    let activeTab = "overview";
</script>

<div class="bg-white border-b border-gray-200 -mt-8 mb-8 pb-8 pt-12">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col md:flex-row gap-8">
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

                <a
                    href="/users/{project.ownerId}"
                    class="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-lg inline-flex hover:bg-gray-100 transition-colors"
                >
                    <img
                        src={project.ownerAvatarUrl || "https://i.pravatar.cc/150?u=project-owner"}
                        alt=""
                        class="w-10 h-10 rounded-full"
                    />
                    <div>
                        <div class="text-xs text-gray-500">Created by</div>
                        <div class="font-bold text-gray-900">
                            {project.ownerName || "Unknown"}
                        </div>
                    </div>
                </a>

                <div class="flex gap-3">
                    {#if data.canEdit}
                        <a
                            href="/projects/{project.id}/edit"
                            class="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition"
                        >
                            <Pencil class="w-4 h-4" /> 編集
                        </a>
                    {/if}
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

        <div class="mt-6">
            <ReactionBar targetId={project.id} targetType="project" />
        </div>
    </div>
</div>

<div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
    <ProjectTabs bind:activeTab />

    <div class="min-h-[300px]">
        {#if activeTab === "overview"}
            <div class="prose max-w-none text-gray-800">
                <h3 class="text-xl font-bold mb-4">詳細説明</h3>
                <p class="whitespace-pre-wrap">{project.description}</p>

                <h3 class="text-xl font-bold mt-8 mb-4">使用技術（タグ）</h3>
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
