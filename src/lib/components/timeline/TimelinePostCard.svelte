<script lang="ts">
    import ReactionBar from "$lib/components/shared/ReactionBar.svelte";
    import CommentSection from "./CommentSection.svelte";
    import {
        TIMELINE_INVALIDATION_KEY,
        type TimelinePostView,
    } from "$lib/shared/timeline";
    import { CheckCircle, Clock, MessageSquareText } from "lucide-svelte";
    import { formatDistanceToNow } from "date-fns";
    import { ja } from "date-fns/locale";

    interface Props {
        post: TimelinePostView;
        compact?: boolean;
        showDetailLink?: boolean;
        showAllComments?: boolean;
        invalidateKey?: string | null;
    }

    let {
        post,
        compact = false,
        showDetailLink = true,
        showAllComments = false,
        invalidateKey = TIMELINE_INVALIDATION_KEY
    }: Props = $props();

    const POST_TYPE_LABEL: Record<TimelinePostView["type"], string> = {
        progress: "進捗",
        question: "相談",
        showcase: "見せびらかし",
    };

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

    let isQuestion = $derived(post.type === "question");
    let isSolved = $derived(isQuestion && post.status === "solved");
    let detailHref = $derived(`/timeline/${post.id}`);
    let commentViews = $derived(showAllComments ? post.comments : post.commentsPreview);
</script>

<div
    class={`bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow ${
        compact ? "p-4 mb-3" : "p-5 mb-4"
    }`}
>
    <div class="flex items-start justify-between mb-3">
        <div class="flex items-center gap-3">
            <img
                src={post.author.avatarUrl ||
                    `https://i.pravatar.cc/150?u=${encodeURIComponent(post.author.id)}`}
                alt=""
                class="w-10 h-10 rounded-full border border-gray-100"
            />
            <div>
                <div class="flex items-center gap-2 flex-wrap">
                    <a
                        href={`/users/${post.author.id}`}
                        class="font-bold text-gray-900 hover:text-indigo-600"
                    >
                        {post.author.displayName}
                    </a>
                    {#if post.project}
                        <a
                            href={`/projects/${post.project.id}`}
                            class="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium truncate max-w-[180px]"
                        >
                            {post.project.title}
                        </a>
                    {/if}
                </div>
                <div class="flex items-center text-xs text-gray-500 gap-2 flex-wrap">
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

        <div
            class="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded text-gray-500 bg-gray-100"
        >
            {POST_TYPE_LABEL[post.type]}
        </div>
    </div>

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

    <div
        class="flex flex-col gap-3 border-t border-gray-100 pt-3 md:flex-row md:items-center md:justify-between"
    >
        <ReactionBar
            targetId={post.id}
            targetType="timeline_post"
            reactions={post.reactions}
            {invalidateKey}
        />

        {#if showDetailLink}
            <a
                href={detailHref}
                class="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
                <MessageSquareText class="w-4 h-4" />
                詳細を見る
            </a>
        {/if}
    </div>

    <CommentSection
        targetId={post.id}
        targetType="timeline_post"
        comments={commentViews}
        commentCount={post.commentCount}
        canSolve={post.viewerCanSolve}
        acceptedCommentId={post.acceptedCommentId}
        defaultShowAll={showAllComments}
        hasFullComments={showAllComments}
        {invalidateKey}
    />
</div>
