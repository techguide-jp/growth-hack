<script lang="ts">
    import { getUser, getProject, api, currentUser } from "$lib/stores/mock";
    import type { TimelinePost } from "$lib/stores/mock/data";
    import ReactionBar from "$lib/components/shared/ReactionBar.svelte";
    import CommentSection from "./CommentSection.svelte";
    import { CheckCircle, Clock } from "lucide-svelte";
    import { formatDistanceToNow } from "date-fns";
    import { ja } from "date-fns/locale";

    export let post: TimelinePost;
    export let compact = false;

    $: author = getUser(post.authorId);
    $: project = post.projectId ? getProject(post.projectId) : null;
    $: isQuestion = post.type === "question";
    $: isSolved = isQuestion && post.status === "solved";
    $: isMyPost = $currentUser?.id === post.authorId;

    function timeAgo(dateStr: string) {
        try {
            return formatDistanceToNow(new Date(dateStr), {
                addSuffix: true,
                locale: ja,
            });
        } catch {
            return dateStr;
        }
    }

    function markSolved(commentId: string) {
        api.solveQuestion(post.id, commentId);
    }
</script>

<div
    class={`bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow ${
        compact ? "p-4 mb-3" : "p-5 mb-4"
    }`}
>
    <!-- Header -->
    <div class="flex items-start justify-between mb-3">
        <div class="flex items-center gap-3">
            <img
                src={$author?.avatarUrl}
                alt=""
                class="w-10 h-10 rounded-full border border-gray-100"
            />
            <div>
                <div class="flex items-center gap-2">
                    <span class="font-bold text-gray-900"
                        >{$author?.name ?? "Unknown"}</span
                    >
                    {#if $project}
                        <span
                            class="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium truncate max-w-[150px]"
                        >
                            {$project.title}
                        </span>
                    {/if}
                </div>
                <div class="flex items-center text-xs text-gray-500 gap-2">
                    <span>{timeAgo(post.createdAt)}</span>
                    {#if isQuestion}
                        {#if isSolved}
                            <span
                                class="flex items-center text-green-600 font-semibold bg-green-50 px-1.5 rounded"
                            >
                                <CheckCircle class="w-3 h-3 mr-1" />解決済み
                            </span>
                        {:else}
                            <span
                                class="flex items-center text-orange-600 font-semibold bg-orange-50 px-1.5 rounded"
                            >
                                <Clock class="w-3 h-3 mr-1" />募集中
                            </span>
                        {/if}
                    {/if}
                </div>
            </div>
        </div>

        <!-- Type Badge -->
        <div
            class="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded text-gray-500 bg-gray-100"
        >
            {post.type}
        </div>
    </div>

    <!-- Content -->
    <div class="mb-4">
        {#if post.title}
            <h3 class="text-lg font-bold text-gray-900 mb-2">{post.title}</h3>
        {/if}

        {#if isQuestion && post.questionMeta}
            <div
                class="bg-orange-50/50 rounded-lg p-3 text-sm space-y-2 mb-3 border border-orange-100/50"
            >
                <div class="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1">
                    <span class="font-bold text-orange-800/70">状況:</span>
                    <span>{post.questionMeta.situation}</span>
                    <span class="font-bold text-orange-800/70">問題:</span>
                    <span>{post.questionMeta.problem}</span>
                    <span class="font-bold text-orange-800/70">試行:</span>
                    <span>{post.questionMeta.tried}</span>
                    <span class="font-bold text-orange-800/70">環境:</span>
                    <span>{post.questionMeta.environment}</span>
                </div>
            </div>
        {/if}

        <p class="text-gray-700 whitespace-pre-wrap">{post.body}</p>
    </div>

    <!-- Reactions & Actions -->
    <div
        class="flex items-center justify-between border-t border-gray-100 pt-3"
    >
        <ReactionBar targetId={post.id} targetType="post" />
    </div>

    <!-- Comments -->
    <CommentSection
        targetId={post.id}
        targetType="post"
        canSolve={isQuestion && !isSolved && isMyPost}
        acceptedCommentId={post.acceptedCommentId}
        onSolve={markSolved}
    />
</div>
