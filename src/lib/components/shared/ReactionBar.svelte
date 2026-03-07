<script lang="ts">
    import { goto, invalidate } from "$app/navigation";
    import { page } from "$app/state";
    import { sessionUser } from "$lib/stores/session";
    import type { ReactionKind, ReactionTargetType } from "$lib/shared/domain";
    import {
        createEmptyTimelineReactionSummary,
        type TimelineReactionSummary,
    } from "$lib/shared/timeline";
    import { Heart, Lightbulb, Flame, LifeBuoy, Hand } from "lucide-svelte";
    import clsx from "clsx";
    import { animate, type DOMKeyframesDefinition } from "motion";
    import { tick } from "svelte";

    interface Props {
        targetId: string;
        targetType: ReactionTargetType;
        reactions?: TimelineReactionSummary[];
        invalidateKey?: string | null;
    }

    let {
        targetId,
        targetType,
        reactions = createEmptyTimelineReactionSummary(),
        invalidateKey = null
    }: Props = $props();

    type ReactionDelta = -1 | 1;
    type ReactionDisplay = (typeof REACTION_CONFIG)[number] & {
        count: number;
        reactedByMe: boolean;
    };

    let currentReactions = $state((() => cloneReactionSummary(reactions))());
    let errorMessage = $state("");
    let isSubmitting = $state(false);
    let lastPropReactionSignature = $state("");

    const REACTION_CONFIG = [
        {
            kind: "clap",
            icon: Hand,
            label: "拍手",
            accent: "234 179 8",
            accentSoft: "254 252 232",
        },
        {
            kind: "like",
            icon: Heart,
            label: "いいね",
            accent: "236 72 153",
            accentSoft: "253 242 248",
        },
        {
            kind: "idea",
            icon: Lightbulb,
            label: "なるほど",
            accent: "250 204 21",
            accentSoft: "254 249 195",
        },
        {
            kind: "fire",
            icon: Flame,
            label: "アツい",
            accent: "239 68 68",
            accentSoft: "254 242 242",
        },
        {
            kind: "help",
            icon: LifeBuoy,
            label: "助ける",
            accent: "59 130 246",
            accentSoft: "239 246 255",
        },
    ] as const;

    function cloneReactionSummary(value: TimelineReactionSummary[]) {
        return value.map((reaction) => ({ ...reaction }));
    }

    function getReactionSignature(value: TimelineReactionSummary[]) {
        return value
            .map(
                (item) =>
                    `${item.kind}:${item.count}:${item.reactedByMe ? "1" : "0"}`,
            )
            .join("|");
    }

    function toggleReactionPreview(kind: ReactionKind) {
        currentReactions = currentReactions.map((reaction) => {
            if (reaction.kind !== kind) {
                return { ...reaction };
            }

            const nextReactedByMe = !reaction.reactedByMe;

            return {
                ...reaction,
                reactedByMe: nextReactedByMe,
                count: Math.max(0, reaction.count + (nextReactedByMe ? 1 : -1)),
            };
        });
    }

    function cancelReactionAnimations(button: HTMLButtonElement) {
        const animationTargets = [
            button.querySelector<HTMLElement>("[data-reaction-glow]"),
            button.querySelector<HTMLElement>("[data-reaction-icon]"),
            button.querySelector<HTMLElement>("[data-reaction-count]"),
            button.querySelector<HTMLElement>("[data-reaction-feedback]"),
        ].filter((element): element is HTMLElement => Boolean(element));

        for (const target of animationTargets) {
            for (const animation of target.getAnimations()) {
                animation.cancel();
            }
        }
    }

    function animateDomElement(
        target: Element,
        keyframes: DOMKeyframesDefinition,
        options: {
            duration: number;
            ease: "ease-out";
        },
    ) {
        return (animate as unknown as typeof animate & ((...args: any[]) => unknown))(
            target,
            keyframes,
            options,
        );
    }

    function playReactionAnimation(
        button: HTMLButtonElement,
        delta: ReactionDelta,
        nextReactedByMe: boolean,
    ) {
        const glow = button.querySelector<HTMLElement>("[data-reaction-glow]");
        const icon = button.querySelector<HTMLElement>("[data-reaction-icon]");
        const count = button.querySelector<HTMLElement>("[data-reaction-count]");
        const feedback = button.querySelector<HTMLElement>(
            "[data-reaction-feedback]",
        );

        cancelReactionAnimations(button);

        if (feedback) {
            feedback.textContent = delta === -1 ? "-1" : "+1";
        }

        if (glow) {
            const glowKeyframes: DOMKeyframesDefinition = {
                opacity: nextReactedByMe
                    ? [0.1, 0.5, 0.32]
                    : [0.26, 0.44, 0],
                scale: nextReactedByMe ? [0.78, 1.16, 1] : [1, 1.08, 0.82],
            };

            animateDomElement(
                glow,
                glowKeyframes,
                {
                    duration: 0.42,
                    ease: "ease-out",
                },
            );
        }

        if (icon) {
            const iconKeyframes: DOMKeyframesDefinition = {
                scale: nextReactedByMe
                    ? [0.88, 1.28, 1]
                    : [1, 0.82, 1.08, 1],
                rotate: nextReactedByMe
                    ? [-14, 10, 0]
                    : [0, -10, 6, 0],
            };

            animateDomElement(
                icon,
                iconKeyframes,
                {
                    duration: 0.34,
                    ease: "ease-out",
                },
            );
        }

        if (count) {
            const countKeyframes: DOMKeyframesDefinition = {
                y: [5, -4, 0],
                opacity: [0.45, 1, 1],
                scale: [0.88, 1.14, 1],
            };

            animateDomElement(
                count,
                countKeyframes,
                {
                    duration: 0.3,
                    ease: "ease-out",
                },
            );
        }

        if (feedback) {
            const feedbackKeyframes: DOMKeyframesDefinition = {
                opacity: [0, 1, 0],
                y: [8, -2, -16],
                scale: [0.84, 1, 1.04],
            };

            animateDomElement(
                feedback,
                feedbackKeyframes,
                {
                    duration: 0.52,
                    ease: "ease-out",
                },
            );
        }
    }

    $effect(() => {
        const nextSignature = getReactionSignature(reactions);

        if (nextSignature !== lastPropReactionSignature && !isSubmitting) {
            currentReactions = cloneReactionSummary(reactions);
            lastPropReactionSignature = nextSignature;
        }
    });

    let loginHref = $derived(`/login?next=${encodeURIComponent(
        `${page.url.pathname}${page.url.search}`,
    )}`);

    let reactionStateMap = $derived.by(() => new Map(
            currentReactions.map((reaction) => [
                reaction.kind,
                {
                    count: reaction.count,
                    reactedByMe: reaction.reactedByMe,
                },
            ]),
        ));

    let displayReactions = $derived.by(() =>
        REACTION_CONFIG.map((reaction) => {
            const state = reactionStateMap.get(reaction.kind);

            return {
                ...reaction,
                count: state?.count ?? 0,
                reactedByMe: state?.reactedByMe ?? false,
            };
        }),
    );

    function getReactionState(kind: ReactionKind) {
        return reactionStateMap.get(kind) ?? { count: 0, reactedByMe: false };
    }

    function getReactionButtonStyle(reaction: ReactionDisplay) {
        const baseStyle = `--reaction-accent: ${reaction.accent}; --reaction-accent-soft: ${reaction.accentSoft};`;

        if (!reaction.reactedByMe) {
            return baseStyle;
        }

        return `${baseStyle} color: rgb(${reaction.accent}); background: rgb(${reaction.accentSoft}); box-shadow: inset 0 0 0 1px rgb(${reaction.accent} / 0.18), 0 14px 24px -22px rgb(${reaction.accent} / 0.45);`;
    }

    async function handleToggle(
        kind: (typeof REACTION_CONFIG)[number]["kind"],
        button: HTMLButtonElement,
    ) {
        if (isSubmitting) {
            return;
        }

        if (!$sessionUser) {
            await goto(loginHref);
            return;
        }

        errorMessage = "";
        isSubmitting = true;

        const hadReacted = getReactionState(kind).reactedByMe;
        const previousReactions = cloneReactionSummary(currentReactions);
        const nextReactedByMe = !hadReacted;

        toggleReactionPreview(kind);
        await tick();
        playReactionAnimation(button, hadReacted ? -1 : 1, nextReactedByMe);

        try {
            const method = hadReacted ? "DELETE" : "POST";
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
                currentReactions = previousReactions;
                errorMessage =
                    payload?.message ?? "リアクションの更新に失敗しました。";
                return;
            }

            currentReactions = cloneReactionSummary(
                payload?.reactions ?? currentReactions,
            );

            if (invalidateKey) {
                void invalidate(invalidateKey);
            }
        } catch (error) {
            currentReactions = previousReactions;
            errorMessage =
                error instanceof Error
                    ? error.message
                    : "リアクションの更新に失敗しました。";
        } finally {
            isSubmitting = false;
        }
    }
</script>

<div class="flex flex-col gap-2">
    <div class="flex flex-wrap gap-2">
        {#each displayReactions as reaction (reaction.kind)}
            <button
                class={clsx(
                    "reaction-button group relative isolate flex items-center gap-1.5 overflow-visible rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5",
                    reaction.reactedByMe && "is-reacted",
                )}
                style={getReactionButtonStyle(reaction)}
                aria-pressed={reaction.reactedByMe}
                title={reaction.label}
                onclick={(event) =>
                    handleToggle(
                        reaction.kind,
                        event.currentTarget as HTMLButtonElement,
                    )}
            >
                <span
                    class={clsx(
                        "reaction-glow",
                        reaction.reactedByMe && "is-reacted",
                    )}
                    data-reaction-glow
                    aria-hidden="true"
                ></span>
                <reaction.icon
                    class={clsx(
                        "reaction-icon relative z-10 h-4 w-4",
                        reaction.reactedByMe && "fill-current",
                    )}
                    data-reaction-icon
                />
                <span class="reaction-count relative z-10 min-w-[0.75rem]" data-reaction-count>
                    {reaction.count || ""}
                </span>
                <span class="reaction-feedback" data-reaction-feedback aria-hidden="true">
                    +1
                </span>
            </button>
        {/each}
    </div>

    {#if errorMessage}
        <p class="text-xs text-rose-600">{errorMessage}</p>
    {/if}
</div>

<style>
    .reaction-button {
        transform: translateZ(0);
        color: rgb(107 114 128);
        background: rgb(255 255 255);
    }

    .reaction-button:hover {
        background: rgb(249 250 251);
    }

    .reaction-button.is-reacted {
        color: rgb(var(--reaction-accent));
        background: rgb(var(--reaction-accent-soft));
        box-shadow:
            0 0 0 1px rgb(var(--reaction-accent) / 0.18) inset,
            0 14px 24px -22px rgb(var(--reaction-accent) / 0.45);
    }

    .reaction-button.is-reacted:hover {
        background: rgb(var(--reaction-accent-soft));
    }

    .reaction-glow {
        position: absolute;
        inset: -1px;
        border-radius: 9999px;
        pointer-events: none;
        opacity: 0;
        transform: scale(0.65);
        background:
            radial-gradient(
                circle at center,
                rgba(255, 255, 255, 0.96) 0%,
                rgb(var(--reaction-accent) / 0.28) 42%,
                rgb(var(--reaction-accent) / 0) 74%
            );
    }

    .reaction-glow.is-reacted {
        opacity: 0.32;
        transform: scale(1);
    }

    .reaction-feedback {
        position: absolute;
        top: -0.75rem;
        left: 50%;
        z-index: 20;
        pointer-events: none;
        font-size: 0.7rem;
        font-weight: 700;
        color: rgb(var(--reaction-accent));
        text-shadow: 0 1px 0 rgba(255, 255, 255, 0.8);
        opacity: 0;
        transform: translate(-50%, 0.35rem) scale(0.85);
    }
</style>
