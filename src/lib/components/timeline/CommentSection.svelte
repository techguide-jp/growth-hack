<script lang="ts">
    import { invalidate } from "$app/navigation";
    import { page } from "$app/stores";
    import { sessionUser } from "$lib/stores/session";
    import type { CommentTargetType } from "$lib/shared/domain";
    import type { TimelineCommentView } from "$lib/shared/timeline";
    import { Send, Star, Check } from "lucide-svelte";
    import clsx from "clsx";
    import { formatDistanceToNow } from "date-fns";
    import { ja } from "date-fns/locale";

    export let targetId: string;
    export let targetType: CommentTargetType;
    export let comments: TimelineCommentView[] = [];
    export let commentCount = 0;
    export let canSolve = false;
    export let acceptedCommentId: string | null = null;
    export let defaultShowAll = false;
    export let hasFullComments = false;
    export let invalidateKey: string | null = null;

    let newCommentBody = "";
    let showAll = defaultShowAll;
    let hasLoadedAllComments = hasFullComments;
    let localCanSolve = canSolve;
    let localAcceptedCommentId = acceptedCommentId;
    let currentComments = comments.map((comment) => ({ ...comment }));
    let currentCommentCount = commentCount;
    let isSubmitting = false;
    let isLoadingAll = false;
    let isSolving = false;
    let errorMessage = "";
    let lastCommentsSignature = "";

    function getCommentSignature(value: TimelineCommentView[]) {
        return value
            .map(
                (comment) =>
                    `${comment.id}:${comment.isAccepted ? "1" : "0"}:${comment.body}`,
            )
            .join("|");
    }

    $: {
        const nextSignature = [
            commentCount,
            acceptedCommentId ?? "",
            canSolve ? "1" : "0",
            hasFullComments ? "1" : "0",
            getCommentSignature(comments),
        ].join("|");

        if (
            nextSignature !== lastCommentsSignature &&
            !isSubmitting &&
            !isLoadingAll &&
            !isSolving
        ) {
            currentComments = comments.map((comment) => ({ ...comment }));
            currentCommentCount = commentCount;
            localAcceptedCommentId = acceptedCommentId;
            localCanSolve = canSolve;
            hasLoadedAllComments = hasLoadedAllComments || hasFullComments;
            showAll = showAll || defaultShowAll || hasFullComments;
            lastCommentsSignature = nextSignature;
        }
    }

    $: visibleComments = showAll
        ? currentComments
        : currentComments.slice(-3);
    $: hasMore = currentCommentCount > currentComments.length;
    $: loginHref = `/login?next=${encodeURIComponent(
        `${$page.url.pathname}${$page.url.search}`,
    )}`;

    async function fetchAllComments() {
        const response = await fetch(
            `/api/comments?targetType=${encodeURIComponent(targetType)}&targetId=${encodeURIComponent(targetId)}`,
        );
        const payload = (await response.json().catch(() => null)) as
            | { comments?: TimelineCommentView[]; message?: string }
            | null;

        if (!response.ok) {
            throw new Error(
                payload?.message ?? "コメント一覧の取得に失敗しました。",
            );
        }

        currentComments = (payload?.comments ?? []).map((comment) => ({
            ...comment,
        }));
        currentCommentCount = currentComments.length;
        hasLoadedAllComments = true;
        lastCommentsSignature = [
            currentCommentCount,
            localAcceptedCommentId ?? "",
            localCanSolve ? "1" : "0",
            "1",
            getCommentSignature(currentComments),
        ].join("|");
    }

    async function handleShowAll() {
        if (showAll || isLoadingAll) {
            return;
        }

        errorMessage = "";

        if (!hasLoadedAllComments && hasMore) {
            isLoadingAll = true;

            try {
                await fetchAllComments();
            } catch (error) {
                errorMessage =
                    error instanceof Error
                        ? error.message
                        : "コメント一覧の取得に失敗しました。";
                isLoadingAll = false;
                return;
            }

            isLoadingAll = false;
        }

        showAll = true;
    }

    async function handleAdd() {
        if (!$sessionUser || !newCommentBody.trim() || isSubmitting) {
            return;
        }

        errorMessage = "";
        isSubmitting = true;

        try {
            const response = await fetch("/api/comments", {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    targetId,
                    targetType,
                    body: newCommentBody,
                }),
            });

            const payload = (await response.json().catch(() => null)) as
                | { message?: string }
                | null;

            if (!response.ok) {
                errorMessage =
                    payload?.message ?? "コメントの投稿に失敗しました。";
                return;
            }

            newCommentBody = "";
            await fetchAllComments();
            showAll = true;

            if (invalidateKey) {
                await invalidate(invalidateKey);
            }
        } catch (error) {
            errorMessage =
                error instanceof Error
                    ? error.message
                    : "コメントの投稿に失敗しました。";
        } finally {
            isSubmitting = false;
        }
    }

    async function handleSolve(commentId: string) {
        if (!localCanSolve || isSolving) {
            return;
        }

        errorMessage = "";
        isSolving = true;

        try {
            const response = await fetch(`/api/timeline/${targetId}/solve`, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    acceptedCommentId: commentId,
                }),
            });

            const payload = (await response.json().catch(() => null)) as
                | { message?: string }
                | null;

            if (!response.ok) {
                errorMessage =
                    payload?.message ?? "解決済みへの更新に失敗しました。";
                return;
            }

            localAcceptedCommentId = commentId;
            localCanSolve = false;
            currentComments = currentComments.map((comment) => ({
                ...comment,
                isAccepted: comment.id === commentId,
            }));

            if (invalidateKey) {
                await invalidate(invalidateKey);
            }
        } catch (error) {
            errorMessage =
                error instanceof Error
                    ? error.message
                    : "解決済みへの更新に失敗しました。";
        } finally {
            isSolving = false;
        }
    }
</script>

<div class="mt-3 pt-2">
    {#if hasMore && !showAll}
        <button
            class="text-xs text-gray-500 hover:text-indigo-600 mb-2 disabled:opacity-60"
            disabled={isLoadingAll}
            on:click={handleShowAll}
        >
            {#if isLoadingAll}
                コメントを読み込み中...
            {:else}
                以前のコメントをすべて見る ({currentCommentCount})
            {/if}
        </button>
    {/if}

    <div class="space-y-3 mb-3">
        {#each visibleComments as comment (comment.id)}
            {@const isAccepted = comment.id === localAcceptedCommentId}

            <div
                class={clsx(
                    "flex gap-3 text-sm group",
                    isAccepted && "bg-green-50 p-2 rounded-lg -mx-2",
                )}
            >
                <img
                    src={comment.author.avatarUrl ||
                        `https://i.pravatar.cc/150?u=${encodeURIComponent(comment.author.id)}`}
                    alt=""
                    class="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0"
                />
                <div class="flex-1">
                    <div class="flex justify-between items-start">
                        <div class="font-bold text-gray-900">
                            {comment.author.displayName}
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
                    {:else if localCanSolve}
                        <button
                            class="mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs flex items-center text-gray-400 hover:text-green-600 disabled:opacity-60"
                            disabled={isSolving}
                            on:click={() => handleSolve(comment.id)}
                        >
                            <Check class="w-3 h-3 mr-1" /> これで解決にする
                        </button>
                    {/if}
                </div>
            </div>
        {/each}
    </div>

    {#if $sessionUser}
        <div class="relative">
            <input
                type="text"
                bind:value={newCommentBody}
                placeholder="コメントを書く..."
                class="w-full text-sm rounded-full border-gray-300 pl-4 pr-10 py-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 hover:bg-white transition-colors"
                on:keydown={(event) => event.key === "Enter" && handleAdd()}
            />
            <button
                class="absolute right-2 top-1.5 text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                disabled={!newCommentBody.trim() || isSubmitting}
                on:click={handleAdd}
            >
                <Send class="w-4 h-4" />
            </button>
        </div>
    {:else}
        <div class="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            コメントするには
            <a href={loginHref} class="font-medium text-indigo-600 hover:underline">
                ログイン
            </a>
            してください。
        </div>
    {/if}

    {#if errorMessage}
        <p class="mt-2 text-xs text-rose-600">{errorMessage}</p>
    {/if}
</div>
