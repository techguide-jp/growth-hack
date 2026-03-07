<script lang="ts">
    import { page } from "$app/state";
    import {
        conversations,
        messages,
        users,
        currentUser,
        projects,
        api,
    } from "$lib/stores/mock";
    import { ArrowLeft, Send, Users, UserRound } from "lucide-svelte";

    let newMessage = $state("");

    let conversationId = $derived(page.params.id ?? "");
    let conversation = $derived($conversations.find((item) => item.id === conversationId));
    let thread = $derived([...$messages]
        .filter((message) => message.conversationId === conversationId)
        .sort(
            (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime(),
        ));
    let members = $derived(conversation
        ? $users.filter((user) => conversation.memberIds.includes(user.id))
        : []);

    function getDisplayName(senderId: string) {
        return $users.find((user) => user.id === senderId)?.name ?? "Unknown";
    }

    function getConversationTitle() {
        if (!conversation) return "会話";
        if (conversation.type === "direct") {
            const partner = members.find((member) => member.id !== $currentUser?.id);
            return partner?.name ?? "Direct Message";
        }
        return (
            $projects.find((project) => project.id === conversation.projectId)
                ?.title ?? "Project Conversation"
        );
    }

    function formatTimestamp(value: string) {
        return new Intl.DateTimeFormat("ja-JP", {
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(value));
    }

    function handleSend() {
        const body = newMessage.trim();
        if (!body || !conversation || !$currentUser) return;
        api.sendMessage(conversation.id, $currentUser.id, body);
        newMessage = "";
    }
</script>

{#if conversation}
    <div class="max-w-4xl mx-auto py-6">
        <div class="mb-4">
            <a
                href="/messages"
                class="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
                <ArrowLeft class="w-4 h-4 mr-1" />
                会話一覧に戻る
            </a>
        </div>

        <section class="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <header class="px-5 py-4 border-b border-gray-100 bg-gray-50">
                <div class="flex items-center gap-3">
                    <div
                        class="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center"
                    >
                        {#if conversation.type === "direct"}
                            <UserRound class="w-5 h-5" />
                        {:else}
                            <Users class="w-5 h-5" />
                        {/if}
                    </div>
                    <div>
                        <h1 class="font-bold text-gray-900">
                            {getConversationTitle()}
                        </h1>
                        <p class="text-xs text-gray-500">
                            {conversation.type === "direct"
                                ? "個人DM"
                                : `${members.length}人のプロジェクト会話`}
                        </p>
                    </div>
                </div>
            </header>

            <div class="h-[420px] overflow-y-auto p-4 bg-gray-50/50">
                {#if thread.length > 0}
                    <div class="space-y-3">
                        {#each thread as message}
                            {@const mine = message.senderId === $currentUser?.id}
                            <div class="flex {mine ? 'justify-end' : 'justify-start'}">
                                <div
                                    class="max-w-[80%] rounded-2xl px-4 py-2 shadow-sm {mine
                                        ? 'bg-indigo-600 text-white rounded-br-md'
                                        : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'}"
                                >
                                    {#if !mine}
                                        <div class="text-xs font-semibold mb-1 text-indigo-600">
                                            {getDisplayName(message.senderId)}
                                        </div>
                                    {/if}
                                    <p class="text-sm whitespace-pre-wrap">
                                        {message.body}
                                    </p>
                                    <div
                                        class="text-[11px] mt-1 {mine
                                            ? 'text-indigo-100'
                                            : 'text-gray-400'}"
                                    >
                                        {formatTimestamp(message.createdAt)}
                                    </div>
                                </div>
                            </div>
                        {/each}
                    </div>
                {:else}
                    <div class="h-full flex items-center justify-center text-gray-400">
                        まだメッセージはありません
                    </div>
                {/if}
            </div>

            <footer class="p-4 border-t border-gray-100 bg-white">
                <div class="flex items-center gap-2">
                    <input
                        type="text"
                        bind:value={newMessage}
                        placeholder="メッセージを入力..."
                        class="flex-1 rounded-full border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        onkeydown={(event) => {
                            if (event.key === "Enter" && !event.isComposing) {
                                event.preventDefault();
                                handleSend();
                            }
                        }}
                    />
                    <button
                        class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                        onclick={handleSend}
                        disabled={!newMessage.trim()}
                        aria-label="送信"
                    >
                        <Send class="w-4 h-4" />
                    </button>
                </div>
            </footer>
        </section>
    </div>
{:else}
    <div class="max-w-3xl mx-auto py-16 text-center">
        <h1 class="text-2xl font-bold text-gray-700 mb-3">
            会話が見つかりませんでした
        </h1>
        <a href="/messages" class="text-indigo-600 hover:underline"
            >会話一覧へ戻る</a
        >
    </div>
{/if}
