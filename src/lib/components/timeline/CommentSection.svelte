<script lang="ts">
    import { api, comments, users } from "$lib/stores/mock";
    import { createEventDispatcher } from "svelte";
    import { Send, Star, Check } from "lucide-svelte";
    import clsx from "clsx";
    import { formatDistanceToNow } from "date-fns";
    import { ja } from "date-fns/locale";

    export let targetId: string;
    export let targetType: "project" | "post" | "comment";
    export let canSolve = false; // If true, show "Accept Answer" buttons
    export let acceptedCommentId: string | undefined = undefined;
    export let onSolve: (commentId: string) => void = () => {};

    let newCommentBody = "";
    let showAll = false;

    $: allComments = $comments.filter(
        (c) => c.targetId === targetId && c.targetType === targetType,
    );
    $: visibleComments = showAll ? allComments : allComments.slice(-3); // Show last 3 by default
    $: hasMore = allComments.length > visibleComments.length;

    function handleAdd() {
        if (!newCommentBody.trim()) return;
        api.addComment({
            targetId,
            targetType,
            authorId: "u1", // Mock current user
            body: newCommentBody,
        });
        newCommentBody = "";
        showAll = true;
    }

    function getAuthor(id: string) {
        return $users.find((u) => u.id === id);
    }
</script>

<div class="mt-3 pt-2">
    {#if hasMore && !showAll}
        <button
            class="text-xs text-gray-500 hover:text-indigo-600 mb-2"
            on:click={() => (showAll = true)}
        >
            以前のコメントをすべて見る ({allComments.length})
        </button>
    {/if}

    <div class="space-y-3 mb-3">
        {#each visibleComments as comment (comment.id)}
            {@const author = getAuthor(comment.authorId)}
            {@const isAccepted = comment.id === acceptedCommentId}

            <div
                class={clsx(
                    "flex gap-3 text-sm group",
                    isAccepted && "bg-green-50 p-2 rounded-lg -mx-2",
                )}
            >
                <img
                    src={author?.avatarUrl}
                    alt=""
                    class="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0"
                />
                <div class="flex-1">
                    <div class="flex justify-between items-start">
                        <div class="font-bold text-gray-900">
                            {author?.name}
                        </div>
                        <div class="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(comment.createdAt), {
                                addSuffix: true,
                                locale: ja,
                            })}
                        </div>
                    </div>

                    <div class="text-gray-800 break-words">{comment.body}</div>

                    {#if isAccepted}
                        <div
                            class="mt-1 flex items-center text-xs font-bold text-green-700"
                        >
                            <Star class="w-3 h-3 mr-1 fill-current" /> ベストアンサー
                        </div>
                    {:else if canSolve}
                        <button
                            class="mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs flex items-center text-gray-400 hover:text-green-600"
                            on:click={() => onSolve(comment.id)}
                        >
                            <Check class="w-3 h-3 mr-1" /> これで解決にする
                        </button>
                    {/if}
                </div>
            </div>
        {/each}
    </div>

    <div class="relative">
        <input
            type="text"
            bind:value={newCommentBody}
            placeholder="コメントを書く..."
            class="w-full text-sm rounded-full border-gray-300 pl-4 pr-10 py-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 hover:bg-white transition-colors"
            on:keydown={(e) => e.key === "Enter" && handleAdd()}
        />
        <button
            class="absolute right-2 top-1.5 text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
            disabled={!newCommentBody}
            on:click={handleAdd}
        >
            <Send class="w-4 h-4" />
        </button>
    </div>
</div>
