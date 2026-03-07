<script lang="ts">
    import { api, supportRecords, currentUser, users } from "$lib/stores/mock";
    import { ExternalLink, Gift, CheckCircle, Clock } from "lucide-svelte";
    import clsx from "clsx";
    import { format } from "date-fns";

    type ProjectSupportPanelProject = {
        id: string;
        ownerId: string;
        title: string;
        ownerName?: string | null;
        ownerAvatarUrl?: string | null;
    };

    interface Props {
        project: ProjectSupportPanelProject;
    }

    let { project }: Props = $props();

    let amount = $state(1000);
    let message = $state("");
    let showForm = $state(false);

    let isOwner = $derived($currentUser?.id === project.ownerId);
    let loginHref = $derived(`/login?next=${encodeURIComponent(`/projects/${project.id}`)}`);
    let records = $derived($supportRecords.filter((r) => r.projectId === project.id));
    let confirmedRecords = $derived(records.filter((r) => r.status === "confirmed"));
    let totalAmount = $derived(confirmedRecords.reduce((sum, r) => sum + r.amount, 0));

    // Sort: awaiting_owner first, then new to old
    let sortedRecords = $derived([...records].sort((a, b) => {
        if (a.status === "awaiting_owner" && b.status !== "awaiting_owner")
            return -1;
        if (a.status !== "awaiting_owner" && b.status === "awaiting_owner")
            return 1;
        return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }));

    function handleSubmit() {
        if (!$currentUser) return;

        api.createSupportRecord({
            projectId: project.id,
            supporterId: $currentUser.id,
            amount,
            message,
        });
        showForm = false;
        message = "";
        amount = 1000;
    }

    function handleConfirm(id: string) {
        if (!confirm("受領を確定しますか？")) return;
        api.confirmSupportRecord(id);
    }

    function getSupporterName(id: string) {
        return $users.find((u) => u.id === id)?.name || "Guest";
    }
</script>

<div class="space-y-6">
    <!-- Stats -->
    <div
        class="bg-indigo-50 rounded-xl p-6 text-center border border-indigo-100"
    >
        <div
            class="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-1"
        >
            Total Support
        </div>
        <div class="text-4xl font-black text-indigo-900">
            ¥{totalAmount.toLocaleString()}
        </div>

        <div class="mt-4 flex justify-center gap-4">
            <button
                class="flex items-center px-4 py-2 bg-white text-indigo-600 rounded-lg shadow-sm border border-indigo-200 text-sm font-bold hover:bg-indigo-50"
            >
                <ExternalLink class="w-4 h-4 mr-2" />
                GitHub Sponsors
            </button>
            <button
                class="flex items-center px-4 py-2 bg-white text-indigo-600 rounded-lg shadow-sm border border-indigo-200 text-sm font-bold hover:bg-indigo-50"
            >
                <ExternalLink class="w-4 h-4 mr-2" />
                Buy Me a Coffee
            </button>
        </div>
    </div>

    <!-- Action Area -->
    {#if !$currentUser}
        <div class="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center">
            <p class="text-sm text-gray-600">
                支援記録を作成するにはログインが必要です。
            </p>
            <a
                href={loginHref}
                class="mt-4 inline-flex items-center rounded-md bg-pink-600 px-4 py-2 text-sm font-bold text-white hover:bg-pink-700"
            >
                <Gift class="w-4 h-4 mr-2" />
                ログインして支援を記録する
            </a>
        </div>
    {:else if !showForm}
        <div class="text-center">
            <button
                class="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-base font-bold rounded-md text-white bg-pink-600 hover:bg-pink-700"
                onclick={() => (showForm = true)}
            >
                <Gift class="w-5 h-5 mr-2" />
                支援しました！ (記録をつける)
            </button>
            <p class="mt-2 text-xs text-gray-500">
                外部サービスで投げ銭した後、ここで記録を作成してください。
            </p>
        </div>
    {:else}
        <div class="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 class="font-bold text-gray-900 mb-4 flex items-center">
                <Gift class="w-5 h-5 mr-2 text-pink-500" /> 支援記録の作成
            </h3>

            <div class="space-y-4">
                <div>
                    <label for="support-amount" class="block text-sm font-medium text-gray-700"
                        >支援額 (JPY)</label
                    >
                    <input
                        id="support-amount"
                        type="number"
                        bind:value={amount}
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                    />
                </div>
                <div>
                    <label for="support-message" class="block text-sm font-medium text-gray-700"
                        >メッセージ (任意)</label
                    >
                    <textarea
                        id="support-message"
                        bind:value={message}
                        rows="2"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                    ></textarea>
                </div>
                <div class="flex justify-end gap-2 pt-2">
                    <button
                        class="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
                        onclick={() => (showForm = false)}>キャンセル</button
                    >
                    <button
                        class="px-4 py-2 bg-pink-600 text-white rounded-md text-sm font-bold shadow hover:bg-pink-700"
                        onclick={handleSubmit}>記録する</button
                    >
                </div>
            </div>
        </div>
    {/if}

    <!-- History List -->
    <div class="space-y-3">
        <h4 class="font-bold text-gray-900 border-b pb-2">
            支援履歴 ({records.length})
        </h4>

        {#each sortedRecords as record (record.id)}
            {@const supporterName = getSupporterName(record.supporterId)}
            <div
                class="flex items-start justify-between bg-white p-4 rounded-lg border border-gray-100 shadow-sm"
            >
                <div class="flex gap-3">
                    <div
                        class={clsx(
                            "w-10 h-10 rounded-full flex items-center justify-center font-bold text-white",
                            record.status === "confirmed"
                                ? "bg-indigo-500"
                                : "bg-gray-400",
                        )}
                    >
                        ¥
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="font-bold text-gray-900"
                                >{supporterName}</span
                            >
                            <span class="text-gray-500 text-sm"
                                >が <span class="font-bold text-gray-900"
                                    >¥{record.amount.toLocaleString()}</span
                                > を支援</span
                            >
                            {#if record.status === "confirmed"}
                                <span
                                    class="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded flex items-center"
                                >
                                    <CheckCircle class="w-3 h-3 mr-1" /> 確定など
                                </span>
                            {:else if record.status === "awaiting_owner"}
                                <span
                                    class="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded flex items-center"
                                >
                                    <Clock class="w-3 h-3 mr-1" /> 承認待ち
                                </span>
                            {/if}
                        </div>
                        {#if record.message}
                            <p class="text-sm text-gray-600 mt-1">
                                "{record.message}"
                            </p>
                        {/if}
                        <div class="text-xs text-gray-400 mt-1">
                            {format(
                                new Date(record.createdAt),
                                "yyyy/MM/dd HH:mm",
                            )}
                        </div>
                    </div>
                </div>

                <!-- Owner Action -->
                {#if isOwner && record.status === "awaiting_owner"}
                    <button
                        class="flex-shrink-0 ml-2 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded hover:bg-indigo-700 shadow-sm"
                        onclick={() => handleConfirm(record.id)}
                    >
                        受け取り確認
                    </button>
                {/if}
            </div>
        {/each}
    </div>
</div>
