<script lang="ts">
    import {
        conversations,
        messages,
        users,
        currentUser,
        projects,
    } from "$lib/stores/mock";
    import { MessageSquare, Users, UserRound, ChevronRight } from "lucide-svelte";

    let myConversations = $derived([...$conversations]
        .filter((conversation) =>
            conversation.memberIds.includes($currentUser?.id ?? ""),
        )
        .sort(
            (a, b) =>
                new Date(b.lastMessageAt).getTime() -
                new Date(a.lastMessageAt).getTime(),
        ));

    function getPartnerName(memberIds: string[]) {
        const partnerId = memberIds.find((id) => id !== $currentUser?.id);
        return $users.find((user) => user.id === partnerId)?.name ?? "Unknown";
    }

    function getProjectTitle(projectId?: string) {
        if (!projectId) return "Project Conversation";
        return $projects.find((project) => project.id === projectId)?.title ?? "Project Conversation";
    }

    function getLastMessage(conversationId: string) {
        const history = $messages
            .filter((message) => message.conversationId === conversationId)
            .sort(
                (a, b) =>
                    new Date(a.createdAt).getTime() -
                    new Date(b.createdAt).getTime(),
            );
        return history[history.length - 1];
    }

    function formatDate(value: string) {
        return new Intl.DateTimeFormat("ja-JP", {
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(value));
    }
</script>

<div class="max-w-4xl mx-auto py-6">
    <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900 flex items-center">
            <MessageSquare class="w-6 h-6 mr-2 text-indigo-600" />
            メッセージ
        </h1>
        <p class="text-sm text-gray-500 mt-1">
            個人DMとプロジェクト会話のモック一覧です。
        </p>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {#if myConversations.length > 0}
            <div class="divide-y divide-gray-100">
                {#each myConversations as conversation}
                    {@const lastMessage = getLastMessage(conversation.id)}
                    <a
                        href="/messages/{conversation.id}"
                        class="block p-4 hover:bg-gray-50 transition-colors"
                    >
                        <div class="flex items-start gap-3">
                            <div
                                class="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center flex-shrink-0"
                            >
                                {#if conversation.type === "direct"}
                                    <UserRound class="w-5 h-5" />
                                {:else}
                                    <Users class="w-5 h-5" />
                                {/if}
                            </div>
                            <div class="min-w-0 flex-1">
                                <div class="flex items-center justify-between gap-3">
                                    <div class="font-bold text-gray-900 truncate">
                                        {conversation.type === "direct"
                                            ? getPartnerName(conversation.memberIds)
                                            : getProjectTitle(conversation.projectId)}
                                    </div>
                                    <div class="text-xs text-gray-400 whitespace-nowrap">
                                        {formatDate(conversation.lastMessageAt)}
                                    </div>
                                </div>
                                <div class="text-xs text-gray-500 mt-1 mb-2">
                                    {conversation.type === "direct"
                                        ? "個人DM"
                                        : "プロジェクト会話"}
                                </div>
                                <div class="text-sm text-gray-600 truncate">
                                    {lastMessage
                                        ? lastMessage.body
                                        : "まだメッセージはありません"}
                                </div>
                            </div>
                            <ChevronRight
                                class="w-4 h-4 text-gray-300 flex-shrink-0 mt-2"
                            />
                        </div>
                    </a>
                {/each}
            </div>
        {:else}
            <div class="p-10 text-center text-gray-500">
                会話はまだありません。ダッシュボードから会話を開いてみてください。
            </div>
        {/if}
    </div>
</div>
