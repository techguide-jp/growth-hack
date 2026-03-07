<script lang="ts">
    import { page } from "$app/stores";
    import { sessionUser } from "$lib/stores/session";
    import {
        supportRecords,
        messages,
        conversations,
        users,
    } from "$lib/stores/mock";
    import ProjectCard from "$lib/components/projects/ProjectCard.svelte";
    import TimelinePostCard from "$lib/components/timeline/TimelinePostCard.svelte";
    import type {
        ProjectHelpType,
        ProjectStage,
        ProjectStatus,
    } from "$lib/shared/domain";
    import type { TimelinePostView } from "$lib/shared/timeline";
    import { Plus, Gift, MessageSquare, HelpCircle } from "lucide-svelte";

    export let data: {
        myProjects: Array<{
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
        }>;
        myUnresolvedQuestions: TimelinePostView[];
    };

    $: myProjectIds = data.myProjects.map((project) => project.id);
    $: pendingSupports = $supportRecords.filter(
        (record) =>
            myProjectIds.includes(record.projectId) &&
            record.status === "awaiting_owner",
    );

    $: myConversations = $conversations
        .filter((conversation) =>
            conversation.memberIds.includes($sessionUser?.id ?? ""),
        )
        .sort(
            (a, b) =>
                new Date(b.lastMessageAt).getTime() -
                new Date(a.lastMessageAt).getTime(),
        );

    $: focusModes = $page.data.preferences?.focusModes ?? [];

    function getPartner(memberIds: string[]) {
        const partnerId = memberIds.find((id) => id !== $sessionUser?.id);
        return $users.find((user) => user.id === partnerId);
    }

    function getLastMessage(conversationId: string) {
        const history = $messages.filter(
            (message) => message.conversationId === conversationId,
        );
        return history[history.length - 1];
    }
</script>

<div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
    <div class="flex items-center gap-4 mb-8">
        <img
            src={$sessionUser?.avatarUrl ||
                `https://i.pravatar.cc/150?u=${encodeURIComponent($sessionUser?.id ?? "guest")}`}
            class="w-16 h-16 rounded-full border-2 border-white shadow"
            alt=""
        />
        <div>
            <h1 class="text-3xl font-bold text-gray-900">
                {$sessionUser?.name ?? "User"}のダッシュボード
            </h1>
            <p class="text-gray-500">{$sessionUser?.email}</p>
            <div class="flex gap-2 mt-2 flex-wrap">
                {#each focusModes as mode}
                    <span
                        class="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200"
                    >
                        #{mode}
                    </span>
                {/each}
            </div>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 space-y-8">
            {#if data.myUnresolvedQuestions.length > 0}
                <section>
                    <div class="flex items-center justify-between mb-4">
                        <h2
                            class="text-xl font-bold text-gray-900 flex items-center"
                        >
                            <HelpCircle class="w-5 h-5 mr-2 text-amber-500" />
                            未解決の相談
                        </h2>
                    </div>
                    <div class="space-y-4">
                        {#each data.myUnresolvedQuestions as post (post.id)}
                            <TimelinePostCard {post} compact />
                        {/each}
                    </div>
                </section>
            {/if}

            <section>
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-bold text-gray-900">
                        自分のプロジェクト ({data.myProjects.length})
                    </h2>
                    <a
                        href="/projects/new"
                        class="inline-flex items-center text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100"
                    >
                        <Plus class="w-4 h-4 mr-1" /> 新規作成
                    </a>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {#each data.myProjects as project (project.id)}
                        <ProjectCard {project} />
                    {/each}
                    {#if data.myProjects.length === 0}
                        <div
                            class="col-span-full py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-500"
                        >
                            プロジェクトがまだありません。
                        </div>
                    {/if}
                </div>
            </section>
        </div>

        <div class="space-y-6">
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
                                        href={`/projects/${support.projectId}`}
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

            <div
                class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
                <div
                    class="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between"
                >
                    <h3 class="font-bold text-gray-900 flex items-center">
                        <MessageSquare class="w-4 h-4 mr-2" /> メッセージ
                    </h3>
                </div>
                <div class="divide-y divide-gray-100">
                    {#each myConversations as conversation}
                        {@const partner = getPartner(conversation.memberIds)}
                        {@const lastMessage = getLastMessage(conversation.id)}
                        <a
                            href={`/messages/${conversation.id}`}
                            class="block p-3 hover:bg-gray-50 transition-colors"
                        >
                            <div class="flex items-center gap-3">
                                {#if partner}
                                    <img
                                        src={partner.avatarUrl}
                                        class="w-10 h-10 rounded-full bg-gray-200"
                                        alt=""
                                    />
                                {:else}
                                    <div
                                        class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center"
                                    >
                                        <MessageSquare
                                            class="w-5 h-5 text-gray-400"
                                        />
                                    </div>
                                {/if}
                                <div class="flex-1 min-w-0">
                                    <div
                                        class="flex justify-between items-center mb-0.5"
                                    >
                                        <div class="font-bold text-sm truncate">
                                            {partner
                                                ? partner.name
                                                : "Group/Unknown"}
                                        </div>
                                        <div
                                            class="text-xs text-gray-400 whitespace-nowrap ml-2"
                                        >
                                            {new Date(
                                                conversation.lastMessageAt,
                                            ).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div class="text-sm text-gray-500 truncate">
                                        {lastMessage
                                            ? lastMessage.body
                                            : "まだメッセージはありません"}
                                    </div>
                                </div>
                            </div>
                        </a>
                    {:else}
                        <div class="p-4 text-sm text-gray-500 text-center">
                            メッセージはありません
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    </div>
</div>
