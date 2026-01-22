<script lang="ts">
    import {
        currentUser,
        projects,
        supportRecords,
        messages,
        timelinePosts,
        conversations,
        userPreferences,
        users,
    } from "$lib/stores/mock";
    import ProjectCard from "$lib/components/projects/ProjectCard.svelte";
    import TimelinePostCard from "$lib/components/timeline/TimelinePostCard.svelte";
    import { Plus, Gift, MessageSquare, HelpCircle } from "lucide-svelte";

    $: myProjects = $projects.filter((p) => p.ownerId === $currentUser?.id);

    // Support waiting for my confirmation
    $: myProjectIds = myProjects.map((p) => p.id);
    $: pendingSupports = $supportRecords.filter(
        (r) =>
            myProjectIds.includes(r.projectId) && r.status === "awaiting_owner",
    );

    // Unresolved Questions
    $: myUnresolvedQuestions = $timelinePosts.filter(
        (p) =>
            p.authorId === $currentUser?.id &&
            p.type === "question" &&
            p.status === "open",
    );

    // Unread Messages (Mock: Showing recent conversations)
    $: myConversations = $conversations
        .filter((c) => c.memberIds.includes($currentUser?.id ?? ""))
        .sort(
            (a, b) =>
                new Date(b.lastMessageAt).getTime() -
                new Date(a.lastMessageAt).getTime(),
        );

    // Focus Mode
    $: myPreferences = $userPreferences.find(
        (p) => p.userId === $currentUser?.id,
    );
    $: focusModes = myPreferences?.focusModes || [];

    // Helper to get conversation partner
    function getPartner(memberIds: string[]) {
        const partnerId = memberIds.find((id) => id !== $currentUser?.id);
        return $users.find((u) => u.id === partnerId);
    }

    function getLastMessage(conversationId: string) {
        const msgs = $messages.filter(
            (m) => m.conversationId === conversationId,
        );
        return msgs[msgs.length - 1];
    }
</script>

<div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
            <div class="flex gap-2 mt-2">
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
        <!-- Main Column -->
        <div class="lg:col-span-2 space-y-8">
            <!-- Unresolved Questions -->
            {#if myUnresolvedQuestions.length > 0}
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
                        {#each myUnresolvedQuestions as post}
                            <TimelinePostCard {post} compact />
                        {/each}
                    </div>
                </section>
            {/if}

            <!-- Projects -->
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

        <!-- Sidebar -->
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

            <!-- Messages -->
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
                        {@const lastMsg = getLastMessage(conversation.id)}
                        <a
                            href="/messages/{conversation.id}"
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
                                        {lastMsg
                                            ? lastMsg.body
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
