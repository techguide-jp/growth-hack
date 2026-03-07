<script lang="ts">
    import { goto, invalidate } from "$app/navigation";
    import { page } from "$app/stores";
    import { sessionUser } from "$lib/stores/session";
    import type { ReactionTargetType } from "$lib/shared/domain";
    import {
        createEmptyTimelineReactionSummary,
        type TimelineReactionSummary,
    } from "$lib/shared/timeline";
    import { Heart, Lightbulb, Flame, LifeBuoy, Hand } from "lucide-svelte";
    import clsx from "clsx";

    export let targetId: string;
    export let targetType: ReactionTargetType;
    export let reactions: TimelineReactionSummary[] =
        createEmptyTimelineReactionSummary();
    export let invalidateKey: string | null = null;

    let currentReactions = reactions.map((reaction) => ({ ...reaction }));
    let errorMessage = "";
    let isSubmitting = false;
    let lastReactionSignature = "";

    const REACTION_CONFIG = [
        { kind: "clap", icon: Hand, label: "拍手", color: "text-yellow-500" },
        { kind: "like", icon: Heart, label: "いいね", color: "text-pink-500" },
        {
            kind: "idea",
            icon: Lightbulb,
            label: "なるほど",
            color: "text-yellow-400",
        },
        { kind: "fire", icon: Flame, label: "アツい", color: "text-red-500" },
        {
            kind: "help",
            icon: LifeBuoy,
            label: "助ける",
            color: "text-blue-500",
        },
    ] as const;

    function getReactionSignature(value: TimelineReactionSummary[]) {
        return value
            .map(
                (item) =>
                    `${item.kind}:${item.count}:${item.reactedByMe ? "1" : "0"}`,
            )
            .join("|");
    }

    $: {
        const nextSignature = getReactionSignature(reactions);

        if (nextSignature !== lastReactionSignature && !isSubmitting) {
            currentReactions = reactions.map((reaction) => ({ ...reaction }));
            lastReactionSignature = nextSignature;
        }
    }

    $: loginHref = `/login?next=${encodeURIComponent(
        `${$page.url.pathname}${$page.url.search}`,
    )}`;

    function getCount(kind: string) {
        return currentReactions.find((reaction) => reaction.kind === kind)?.count ?? 0;
    }

    function doIReact(kind: string) {
        return currentReactions.some(
            (reaction) => reaction.kind === kind && reaction.reactedByMe,
        );
    }

    async function handleToggle(kind: (typeof REACTION_CONFIG)[number]["kind"]) {
        if (isSubmitting) {
            return;
        }

        if (!$sessionUser) {
            await goto(loginHref);
            return;
        }

        errorMessage = "";
        isSubmitting = true;

        try {
            const method = doIReact(kind) ? "DELETE" : "POST";
            const response = await fetch("/api/reactions", {
                method,
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    targetId,
                    targetType,
                    kind,
                }),
            });

            const payload = (await response.json().catch(() => null)) as
                | { message?: string; reactions?: TimelineReactionSummary[] }
                | null;

            if (!response.ok) {
                errorMessage =
                    payload?.message ?? "リアクションの更新に失敗しました。";
                return;
            }

            currentReactions = (
                payload?.reactions ?? createEmptyTimelineReactionSummary()
            ).map((reaction) => ({ ...reaction }));
            lastReactionSignature = getReactionSignature(currentReactions);

            if (invalidateKey) {
                await invalidate(invalidateKey);
            }
        } finally {
            isSubmitting = false;
        }
    }
</script>

<div class="flex flex-col gap-2">
    <div class="flex flex-wrap gap-2">
        {#each REACTION_CONFIG as { kind, icon, label, color }}
            <button
                class={clsx(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all disabled:opacity-60",
                    doIReact(kind)
                        ? `bg-gray-100 ${color} ring-1 ring-inset ring-gray-200`
                        : "hover:bg-gray-50 text-gray-500",
                )}
                title={label}
                disabled={isSubmitting}
                on:click={() => handleToggle(kind)}
            >
                <svelte:component
                    this={icon}
                    class={clsx("w-4 h-4", doIReact(kind) && "fill-current")}
                />
                <span>{getCount(kind) || ""}</span>
            </button>
        {/each}
    </div>

    {#if errorMessage}
        <p class="text-xs text-rose-600">{errorMessage}</p>
    {/if}
</div>
