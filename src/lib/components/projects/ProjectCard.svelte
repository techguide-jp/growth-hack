<script lang="ts">
    import type { Project } from "$lib/stores/mock/data";
    import { getUser } from "$lib/stores/mock";
    import { getProjectStatusInfo } from "$lib/constants/project";
    import { Calendar, Tag } from "lucide-svelte";
    import { formatDistanceToNow } from "date-fns";
    import { ja } from "date-fns/locale";

    type ProjectCardProject = Project & {
        ownerName?: string | null;
        ownerAvatarUrl?: string | null;
    };

    export let project: ProjectCardProject;

    $: ownerStore = getUser(project.ownerId);
    $: owner = {
        name: project.ownerName ?? $ownerStore?.name,
        avatarUrl: project.ownerAvatarUrl ?? $ownerStore?.avatarUrl,
    };
    $: statusInfo = getProjectStatusInfo(project.status);
</script>

<a
    href="/projects/{project.id}"
    class="block bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all overflow-hidden group"
>
    <!-- Image Placeholder -->
    <div class="h-40 bg-gray-100 relative overflow-hidden">
        {#if project.images.length > 0}
            <img
                src={project.images[0]}
                alt=""
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
        {:else}
            <div
                class="w-full h-full flex items-center justify-center text-gray-300"
            >
                <span class="text-4xl font-bold opacity-20">NO IMAGE</span>
            </div>
        {/if}

        <!-- Status Badge -->
        <div class="absolute top-2 right-2">
            <span
                class="px-2 py-1 text-xs font-bold rounded border backdrop-blur shadow-sm {statusInfo.badgeClass}"
                title={statusInfo.description}
            >
                {statusInfo.label}
            </span>
        </div>
    </div>

    <div class="p-4">
        <div class="flex items-center gap-2 mb-2">
            <img src={owner?.avatarUrl} alt="" class="w-6 h-6 rounded-full" />
            <span class="text-xs text-gray-500">{owner?.name}</span>
            <span class="text-xs text-gray-300">|</span>
            <span class="text-xs text-gray-500 flex items-center">
                <Calendar class="w-3 h-3 mr-1" />
                {formatDistanceToNow(new Date(project.updatedAt), {
                    addSuffix: true,
                    locale: ja,
                })} 更新
            </span>
        </div>

        <h3
            class="text-lg font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors line-clamp-1"
        >
            {project.title}
        </h3>
        <p class="text-sm text-gray-600 mb-3 line-clamp-2">{project.summary}</p>

        <div class="flex flex-wrap gap-1">
            {#each project.tags as tag}
                <span
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                >
                    <Tag class="w-3 h-3 mr-1" />{tag}
                </span>
            {/each}
        </div>
    </div>
</a>
