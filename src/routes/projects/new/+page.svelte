<script lang="ts">
    import type { ProjectStatus } from "$lib/shared/domain";
    import { PROJECT_STATUS_MAP, getProjectStatusInfo } from "$lib/constants/project";
    import { ArrowLeft } from "lucide-svelte";

    const statusKeys = Object.keys(PROJECT_STATUS_MAP) as ProjectStatus[];

    export let form:
        | {
              message?: string;
              values?: {
                  title?: string;
                  summary?: string;
                  description?: string;
                  publicUrl?: string;
                  repoUrl?: string;
                  demoUrl?: string;
                  tags?: string;
                  status?: string;
              };
          }
        | undefined;

    let title = form?.values?.title ?? "";
    let summary = form?.values?.summary ?? "";
    let description = form?.values?.description ?? "";
    let publicUrl = form?.values?.publicUrl ?? "";
    let repoUrl = form?.values?.repoUrl ?? "";
    let tagsInput = form?.values?.tags ?? "";
    let status: ProjectStatus =
        (form?.values?.status as ProjectStatus | undefined) ?? "draft";
    let isSubmitting = false;

    $: selectedStatus = getProjectStatusInfo(status);
</script>

<div class="max-w-3xl mx-auto py-6">
    <a
        href="/projects"
        class="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
    >
        <ArrowLeft class="w-4 h-4" /> 一覧へ戻る
    </a>

    <section class="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h1 class="text-2xl font-bold text-gray-900">プロジェクトを作成</h1>
        <p class="text-sm text-gray-600 mt-2">
            作品の内容を登録すると、ここから公開表示されるページが作成できます。
        </p>

        <form method="POST" class="mt-6 space-y-5" on:submit={() => (isSubmitting = true)}>
            <div class="space-y-2">
                <label class="block text-sm font-bold text-gray-700" for="title"
                    >プロジェクト名</label
                >
                <input
                    id="title"
                    name="title"
                    bind:value={title}
                    required
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="例: Growth Hach 2nd"
                />
            </div>

            <div class="space-y-2">
                <label
                    class="block text-sm font-bold text-gray-700"
                    for="summary"
                    >要約</label
                >
                <input
                    id="summary"
                    name="summary"
                    bind:value={summary}
                    required
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="一言で伝えられる説明"
                />
            </div>

            <div class="space-y-2">
                <label
                    class="block text-sm font-bold text-gray-700"
                    for="description"
                    >詳細説明</label
                >
                <textarea
                    id="description"
                    name="description"
                    bind:value={description}
                    rows="7"
                    required
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="開発背景・目的・進め方などを記載"
                ></textarea>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-2">
                    <label
                        class="block text-sm font-bold text-gray-700"
                        for="status"
                        >公開状態</label
                    >
                    <select
                        id="status"
                        name="status"
                        bind:value={status}
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        {#each statusKeys as key}
                            <option value={key}>
                                {PROJECT_STATUS_MAP[key].label}
                            </option>
                        {/each}
                    </select>
                    <p class="text-xs text-gray-500">
                        {selectedStatus.description}
                    </p>
                </div>

                <div class="space-y-2">
                    <label class="block text-sm font-bold text-gray-700" for="tags"
                        >タグ</label
                    >
                    <input
                        id="tags"
                        name="tags"
                        bind:value={tagsInput}
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Svelte,TypeScript,デザイン（カンマ区切り）"
                    />
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-2">
                    <label
                        class="block text-sm font-bold text-gray-700"
                        for="publicUrl"
                        >公開URL（任意）</label
                    >
                    <input
                        id="publicUrl"
                        name="publicUrl"
                        type="url"
                        bind:value={publicUrl}
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="https://example.com"
                    />
                </div>
                <div class="space-y-2">
                    <label class="block text-sm font-bold text-gray-700" for="repoUrl"
                        >GitHub URL（任意）</label
                    >
                    <input
                        id="repoUrl"
                        name="repoUrl"
                        type="url"
                        bind:value={repoUrl}
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="https://github.com/..."
                    />
                </div>
            </div>

            {#if form?.message}
                <p class="text-sm text-red-600">{form.message}</p>
            {/if}

            <button
                type="submit"
                disabled={isSubmitting}
                class="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isSubmitting ? "作成中..." : "プロジェクトを作成"}
            </button>
        </form>
    </section>
</div>
