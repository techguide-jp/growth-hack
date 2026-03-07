<script lang="ts">
    import ProjectTabs from "$lib/components/projects/ProjectTabs.svelte";
    import SupportPanel from "$lib/components/projects/SupportPanel.svelte";
    import ReactionBar from "$lib/components/shared/ReactionBar.svelte";
    import {
        getProjectHelpTypeInfo,
        getProjectPublishChecklist,
        getProjectStatusInfo,
        getProjectStageInfo,
    } from "$lib/constants/project";
    import type {
        ProjectHelpType,
        ProjectStage,
        ProjectStatus,
    } from "$lib/shared/domain";
    import {
        Github,
        Globe,
        Calendar,
        Pencil,
        ArrowRight,
    } from "lucide-svelte";
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
            oneLiner: string;
            problemStatement: string;
            projectStage: ProjectStage | null;
            helpTypes: ProjectHelpType[];
            helpRequest: string;
            highlights: string[];
            nextMilestone: string;
            feedbackRequest: string;
            backgroundNote: string;
            publicUrl?: string;
            repoUrl?: string;
            demoUrl?: string;
            tags: string[];
            images: string[];
            status: ProjectStatus;
            createdAt: string;
            updatedAt: string;
        };
    };

    const project = data.project;
    let activeTab = "overview";
    $: statusInfo = getProjectStatusInfo(project.status);
    $: stageInfo = getProjectStageInfo(project.projectStage);
    $: helpTypeInfo = project.helpTypes.map((helpType) => ({
        value: helpType,
        ...getProjectHelpTypeInfo(helpType),
    }));
    $: publishChecklist = getProjectPublishChecklist({
        highlights: project.highlights,
        nextMilestone: project.nextMilestone,
        feedbackRequest: project.feedbackRequest,
        tags: project.tags,
        publicUrl: project.publicUrl,
        repoUrl: project.repoUrl,
        demoUrl: project.demoUrl,
        images: project.images,
    });
    $: showOwnerChecklist = data.canEdit && !publishChecklist.every((item) => item.complete);
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
                        class="px-2 py-1 rounded text-xs font-bold bg-indigo-100 text-indigo-700 tracking-widest"
                        >{statusInfo.label}</span
                    >
                    <span
                        class="px-2 py-1 rounded-full border text-xs font-bold {stageInfo.badgeClass}"
                    >
                        {stageInfo.label}
                    </span>
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
                <p class="text-lg text-gray-600 mb-4">{project.oneLiner}</p>

                {#if helpTypeInfo.length > 0}
                    <div class="mb-6 flex flex-wrap gap-2">
                        {#each helpTypeInfo as item}
                            <span
                                class="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700"
                            >
                                {item.label}
                            </span>
                        {/each}
                    </div>
                {/if}

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

        {#if showOwnerChecklist}
            <div class="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                        <h2 class="text-sm font-bold text-amber-900">
                            公開情報をもう少し整えると、協力が集まりやすくなります
                        </h2>
                        <p class="mt-1 text-sm text-amber-800">
                            このプロジェクトは公開を維持しています。未入力の項目を埋めると、初見の人が内容を理解しやすくなります。
                        </p>
                    </div>
                    <a
                        href="/projects/{project.id}/edit"
                        class="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-amber-900 hover:bg-amber-100"
                    >
                        編集して埋める <ArrowRight class="h-4 w-4" />
                    </a>
                </div>

                <div class="mt-4 grid gap-2 md:grid-cols-2">
                    {#each publishChecklist as item}
                        <div
                            class="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm {item.complete
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-rose-200 bg-white text-rose-700'}"
                        >
                            <span
                                class="inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold {item.complete
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-rose-100 text-rose-600'}"
                            >
                                {item.complete ? "✓" : "!"}
                            </span>
                            <span>{item.label}</span>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    </div>
</div>

<div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
    <ProjectTabs bind:activeTab />

    <div class="min-h-[300px]">
        {#if activeTab === "overview"}
            <div class="space-y-8 text-gray-800">
                {#if project.problemStatement}
                    <section class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 class="text-xl font-bold text-gray-900">
                            誰のどんな課題を解決するか
                        </h3>
                        <p class="mt-3 whitespace-pre-wrap text-gray-700">
                            {project.problemStatement}
                        </p>
                    </section>
                {/if}

                {#if project.highlights.length > 0}
                    <section class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 class="text-xl font-bold text-gray-900">
                            できること・見どころ
                        </h3>
                        <ul class="mt-4 space-y-3">
                            {#each project.highlights as highlight}
                                <li class="flex items-start gap-3">
                                    <span
                                        class="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700"
                                    >
                                        ✓
                                    </span>
                                    <span class="text-gray-700">{highlight}</span>
                                </li>
                            {/each}
                        </ul>
                    </section>
                {/if}

                {#if project.helpRequest || helpTypeInfo.length > 0}
                    <section class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 class="text-xl font-bold text-gray-900">今ほしい協力</h3>
                        {#if helpTypeInfo.length > 0}
                            <div class="mt-4 flex flex-wrap gap-2">
                                {#each helpTypeInfo as item}
                                    <span
                                        class="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700"
                                        title={item.description}
                                    >
                                        {item.label}
                                    </span>
                                {/each}
                            </div>
                        {/if}
                        {#if project.helpRequest}
                            <p class="mt-4 whitespace-pre-wrap text-gray-700">
                                {project.helpRequest}
                            </p>
                        {/if}
                    </section>
                {/if}

                {#if project.nextMilestone || project.feedbackRequest}
                    <section class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 class="text-xl font-bold text-gray-900">次の一歩</h3>
                        {#if project.nextMilestone}
                            <div class="mt-4">
                                <div class="text-sm font-bold text-gray-500">
                                    次のマイルストーン
                                </div>
                                <p class="mt-1 text-gray-700">{project.nextMilestone}</p>
                            </div>
                        {/if}
                        {#if project.feedbackRequest}
                            <div class="mt-4">
                                <div class="text-sm font-bold text-gray-500">
                                    見てほしい点 / フィードバックが欲しい点
                                </div>
                                <p class="mt-1 text-gray-700">{project.feedbackRequest}</p>
                            </div>
                        {/if}
                    </section>
                {/if}

                {#if project.tags.length > 0}
                    <section class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 class="text-xl font-bold text-gray-900">使用技術・タグ</h3>
                        <div class="mt-4 flex flex-wrap gap-2">
                            {#each project.tags as tag}
                                <span
                                    class="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700"
                                >
                                    #{tag}
                                </span>
                            {/each}
                        </div>
                    </section>
                {/if}

                {#if project.backgroundNote}
                    <section class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 class="text-xl font-bold text-gray-900">補足・背景</h3>
                        <p class="mt-3 whitespace-pre-wrap text-gray-700">
                            {project.backgroundNote}
                        </p>
                    </section>
                {/if}
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
