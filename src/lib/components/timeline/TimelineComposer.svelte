<script lang="ts">
    import { api, currentUser, projects } from "$lib/stores/mock";
    import { Rocket, HelpCircle, Trophy } from "lucide-svelte";
    import clsx from "clsx";
    import type { PostType } from "$lib/stores/mock/data";

    let type: PostType = "progress";
    let body = "";
    // Question Meta
    let title = "";
    let meta = { situation: "", problem: "", tried: "", environment: "" };

    // Optional linkage
    let selectedProjectId = "";

    $: myProjects = $projects.filter((p) => p.ownerId === $currentUser?.id);

    function handleSubmit() {
        if (!body && type !== "question") return; // Basic validation

        api.addPost({
            authorId: $currentUser?.id || "guest",
            type,
            title: type !== "progress" ? title : undefined,
            body,
            projectId: selectedProjectId || undefined,
            questionMeta: type === "question" ? { ...meta } : undefined,
            status: type === "question" ? "open" : undefined,
        });

        // Reset
        body = "";
        title = "";
        meta = { situation: "", problem: "", tried: "", environment: "" };
        selectedProjectId = "";
    }

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
                on:click={() => (type = t.id)}
            >
                <svelte:component this={t.icon} class="w-4 h-4" />
                {t.label}
            </button>
        {/each}
    </div>

    <form on:submit|preventDefault={handleSubmit} class="space-y-3">
        <!-- Project Link (Optional) -->
        {#if myProjects.length > 0}
            <div>
                <select
                    bind:value={selectedProjectId}
                    class="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 w-full md:w-auto"
                >
                    <option value="">(プロジェクトに関連付ける)</option>
                    {#each myProjects as p}
                        <option value={p.id}>{p.title}</option>
                    {/each}
                </select>
            </div>
        {/if}

        <!-- Fields based on Type -->
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

        <div class="flex justify-end pt-2">
            <button
                type="submit"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                投稿する
            </button>
        </div>
    </form>
</div>
