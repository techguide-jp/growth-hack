<script lang="ts">
    import { invalidate } from "$app/navigation";
    import { page } from "$app/state";
    import { sessionUser } from "$lib/stores/session";
    import type { TimelinePostType } from "$lib/shared/domain";
    import { TIMELINE_INVALIDATION_KEY } from "$lib/shared/timeline";
    import { Rocket, HelpCircle, Trophy } from "lucide-svelte";
    import clsx from "clsx";

    type TimelineComposerProject = {
        id: string;
        title: string;
    };

    interface Props {
        projects?: TimelineComposerProject[];
        invalidateKey?: string;
    }

    let { projects = [], invalidateKey = TIMELINE_INVALIDATION_KEY }: Props = $props();

    let type: TimelinePostType = $state("progress");
    let body = $state("");
    let title = $state("");
    let meta = $state({ situation: "", problem: "", tried: "", environment: "" });
    let selectedProjectId = $state("");
    let errorMessage = $state("");
    let isSubmitting = $state(false);

    let loginHref = $derived(`/login?next=${encodeURIComponent(
        `${page.url.pathname}${page.url.search}`,
    )}`);

    const TYPES = [
        {
            id: "progress",
            label: "進捗",
            icon: Rocket,
            color: "text-green-600 bg-green-50",
        },
        {
            id: "question",
            label: "相談",
            icon: HelpCircle,
            color: "text-orange-600 bg-orange-50",
        },
        {
            id: "showcase",
            label: "見せびらかし",
            icon: Trophy,
            color: "text-yellow-600 bg-yellow-50",
        },
    ] as const;

    async function handleSubmit(event: SubmitEvent) {
        event.preventDefault();

        if (!$sessionUser || isSubmitting) {
            return;
        }

        errorMessage = "";
        isSubmitting = true;

        try {
            const response = await fetch("/api/timeline", {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    type,
                    title: type !== "progress" ? title : undefined,
                    body,
                    projectId: selectedProjectId || undefined,
                    questionMeta: type === "question" ? { ...meta } : undefined,
                }),
            });

            const payload = (await response.json().catch(() => null)) as
                | { message?: string }
                | null;

            if (!response.ok) {
                errorMessage =
                    payload?.message ?? "投稿の保存に失敗しました。";
                return;
            }

            body = "";
            title = "";
            meta = { situation: "", problem: "", tried: "", environment: "" };
            selectedProjectId = "";
            await invalidate(invalidateKey);
        } finally {
            isSubmitting = false;
        }
    }
</script>

<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
    <div class="flex gap-2 mb-4">
        {#each TYPES as t}
            <button
                class={clsx(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border font-medium transition-all",
                    type === t.id
                        ? `${t.color} border-current ring-1 ring-inset`
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50",
                )}
                disabled={isSubmitting}
                onclick={() => (type = t.id)}
            >
                <t.icon class="w-4 h-4" />
                {t.label}
            </button>
        {/each}
    </div>

    {#if $sessionUser}
        <form onsubmit={handleSubmit} class="space-y-3">
            {#if projects.length > 0}
                <div>
                    <select
                        bind:value={selectedProjectId}
                        class="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 w-full md:w-auto"
                    >
                        <option value="">(プロジェクトに関連付ける)</option>
                        {#each projects as project}
                            <option value={project.id}>{project.title}</option>
                        {/each}
                    </select>
                </div>
            {/if}

            {#if type === "progress"}
                <textarea
                    bind:value={body}
                    placeholder="今日やったこと、次やること..."
                    rows="3"
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                ></textarea>
            {:else if type === "showcase"}
                <input
                    type="text"
                    bind:value={title}
                    placeholder="何ができた？（例: ログイン機能を実装しました！）"
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm font-bold"
                />
                <textarea
                    bind:value={body}
                    placeholder="アピールポイント、URL、スクショの場所など..."
                    rows="3"
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                ></textarea>
            {:else if type === "question"}
                <input
                    type="text"
                    bind:value={title}
                    placeholder="困りごとを一言で（例: Vercelへのデプロイが失敗する）"
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm font-bold"
                />

                <div
                    class="grid grid-cols-1 gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100"
                >
                    <div>
                        <label
                            for="question-situation"
                            class="block text-xs font-semibold text-orange-800 mb-1"
                            >状況</label
                        >
                        <textarea
                            id="question-situation"
                            bind:value={meta.situation}
                            rows="2"
                            class="w-full text-xs rounded border-orange-200"
                            placeholder="何をしようとしてどうなったか"
                        ></textarea>
                    </div>
                    <div>
                        <label
                            for="question-problem"
                            class="block text-xs font-semibold text-orange-800 mb-1"
                            >困りごと（エラー文など）</label
                        >
                        <textarea
                            id="question-problem"
                            bind:value={meta.problem}
                            rows="2"
                            class="w-full text-xs rounded border-orange-200"
                            placeholder="具体的なエラーメッセージや現象"
                        ></textarea>
                    </div>
                    <div>
                        <label
                            for="question-tried"
                            class="block text-xs font-semibold text-orange-800 mb-1"
                            >試したこと</label
                        >
                        <textarea
                            id="question-tried"
                            bind:value={meta.tried}
                            rows="1"
                            class="w-full text-xs rounded border-orange-200"
                            placeholder="検索して試した解決策など"
                        ></textarea>
                    </div>
                    <div>
                        <label
                            for="env-input"
                            class="block text-xs font-semibold text-orange-800 mb-1"
                            >環境</label
                        >
                        <input
                            id="env-input"
                            type="text"
                            bind:value={meta.environment}
                            class="w-full text-xs rounded border-orange-200"
                            placeholder="OS, 言語バージョン, FWなど"
                        />
                    </div>
                </div>

                <textarea
                    bind:value={body}
                    placeholder="補足情報があれば..."
                    rows="2"
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                ></textarea>
            {/if}

            {#if errorMessage}
                <p class="text-sm text-rose-600">{errorMessage}</p>
            {/if}

            <div class="flex justify-end pt-2">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    {isSubmitting ? "送信中..." : "投稿する"}
                </button>
            </div>
        </form>
    {:else}
        <div class="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
            <p class="text-sm text-gray-600">
                投稿や相談をするにはログインが必要です。
            </p>
            <a
                href={loginHref}
                class="mt-4 inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
                ログインして投稿する
            </a>
        </div>
    {/if}
</div>
