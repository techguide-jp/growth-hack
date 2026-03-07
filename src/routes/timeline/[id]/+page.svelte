<script lang="ts">
    import TimelinePostCard from "$lib/components/timeline/TimelinePostCard.svelte";
    import type { PageProps } from "./$types";
    import type { TimelinePostView } from "$lib/shared/timeline";
    import { ArrowLeft } from "lucide-svelte";

    let { data }: PageProps = $props();
</script>

<div class="mx-auto max-w-3xl space-y-6">
    <a
        href="/timeline"
        class="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
    >
        <ArrowLeft class="h-4 w-4" />
        タイムラインに戻る
    </a>

    <div>
        <TimelinePostCard
            post={data.post}
            showDetailLink={false}
            showAllComments={true}
        />
    </div>
</div>
