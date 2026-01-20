<script lang="ts">
    import {
        currentUser,
        projects,
        supportRecords,
        messages,
    } from "$lib/stores/mock";
    import ProjectCard from "$lib/components/projects/ProjectCard.svelte";
    import { Plus, Gift, MessageSquare } from "lucide-svelte";

    $: myProjects = $projects.filter((p) => p.ownerId === $currentUser?.id);

    // Support waiting for my confirmation
    $: myProjectIds = myProjects.map((p) => p.id);
    $: pendingSupports = $supportRecords.filter(
        (r) =>
            myProjectIds.includes(r.projectId) && r.status === "awaiting_owner",
    );
</script>

<div class="max-w-7xl mx-auto py-8">
    <div class="flex items-center gap-4 mb-8">
        <img
            src={$currentUser?.avatarUrl}
            class="w-16 h-16 rounded-full border-2 border-white shadow"
            alt=""
        />
        <div>
            <h1 class="text-3xl font-bold text-gray-900">
                {$currentUser?.name}のダッシュボード
            </h1>
            <p class="text-gray-500">{$currentUser?.email}</p>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left: Projects -->
        <div class="lg:col-span-2 space-y-8">
            <section>
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-bold text-gray-900">
                        自分のプロジェクト ({myProjects.length})
                    </h2>
                    <button
                        class="flex items-center text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100"
                    >
                        <Plus class="w-4 h-4 mr-1" /> 新規作成
                    </button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {#each myProjects as project}
                        <ProjectCard {project} />
                    {/each}
                    {#if myProjects.length === 0}
                        <div
                            class="col-span-full py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-500"
                        >
                            プロジェクトがまだありません。
                        </div>
                    {/if}
                </div>
            </section>
        </div>

        <!-- Right: Notifications / Pending Actions -->
        <div class="space-y-6">
            <!-- Support Pending -->
            <div
                class="bg-white rounded-xl shadow-sm border border-orange-200 overflow-hidden"
            >
                <div
                    class="bg-orange-50 px-4 py-3 border-b border-orange-100 flex items-center justify-between"
                >
                    <h3 class="font-bold text-orange-900 flex items-center">
                        <Gift class="w-4 h-4 mr-2" /> 承認待ちの支援
                    </h3>
                    {#if pendingSupports.length > 0}
                        <span
                            class="bg-orange-200 text-orange-800 text-xs font-bold px-2 py-0.5 rounded-full"
                            >{pendingSupports.length}</span
                        >
                    {/if}
                </div>
                <div class="p-4">
                    {#if pendingSupports.length > 0}
                        <div class="space-y-3">
                            {#each pendingSupports as support}
                                <div class="text-sm">
                                    <div class="font-bold">
                                        ¥{support.amount.toLocaleString()}
                                    </div>
                                    <a
                                        href="/projects/{support.projectId}"
                                        class="text-indigo-600 hover:underline text-xs"
                                        >確認画面へ</a
                                    >
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <div class="text-sm text-gray-500 text-center py-2">
                            承認待ちはありません
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>
