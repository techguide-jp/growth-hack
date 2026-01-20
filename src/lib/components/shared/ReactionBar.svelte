<script lang="ts">
    import { api, reactions, currentUser } from "$lib/stores/mock";
    import { Heart, Lightbulb, Flame, LifeBuoy, Hand } from "lucide-svelte";
    import clsx from "clsx";

    export let targetId: string;
    export let targetType: "project" | "post" | "comment";

    // 5 kinds: clap, like, idea, fire, help
    // Map icons
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

    $: currentReactions = $reactions.filter(
        (r) => r.targetId === targetId && r.targetType === targetType,
    );
    $: myUserId = $currentUser?.id;

    function handleToggle(kind: (typeof REACTION_CONFIG)[number]["kind"]) {
        if (!myUserId) return; // TODO: Prompt login
        api.toggleReaction(targetId, targetType, kind, myUserId);
    }

    function getCount(kind: string) {
        return currentReactions.filter((r) => r.kind === kind).length;
    }

    function doIReact(kind: string) {
        return currentReactions.some(
            (r) => r.kind === kind && r.userId === myUserId,
        );
    }
</script>

<div class="flex flex-wrap gap-2">
    {#each REACTION_CONFIG as { kind, icon, label, color }}
        <button
            class={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                doIReact(kind)
                    ? `bg-gray-100 ${color} ring-1 ring-inset ring-gray-200`
                    : "hover:bg-gray-50 text-gray-500",
            )}
            title={label}
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
