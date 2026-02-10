<script lang="ts">
    import { Shield, Megaphone, Calendar, Send } from "lucide-svelte";
    import { MOCK_EVENTS } from "$lib/stores/mock/events";

    type Announcement = {
        id: string;
        title: string;
        body: string;
        targetType: "all" | "event";
        eventId?: string;
        publishedAt: string;
    };

    let title = "";
    let body = "";
    let targetType: "all" | "event" = "all";
    let targetEventId = MOCK_EVENTS[0]?.id ?? "";
    let error = "";

    let announcements: Announcement[] = [
        {
            id: "ann-1",
            title: "今週の投稿テーマ",
            body: "開発の詰まりポイントを相談投稿で共有してみましょう。",
            targetType: "all",
            publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        },
    ];

    function getEventTitle(eventId?: string) {
        if (!eventId) return "全体";
        return MOCK_EVENTS.find((event) => event.id === eventId)?.title ?? "イベント";
    }

    function publishAnnouncement() {
        if (!title.trim() || !body.trim()) {
            error = "タイトルと本文を入力してください。";
            return;
        }
        error = "";
        announcements = [
            {
                id: crypto.randomUUID(),
                title: title.trim(),
                body: body.trim(),
                targetType,
                eventId: targetType === "event" ? targetEventId : undefined,
                publishedAt: new Date().toISOString(),
            },
            ...announcements,
        ];
        title = "";
        body = "";
        targetType = "all";
    }

    function formatDate(value: string) {
        return new Intl.DateTimeFormat("ja-JP", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(value));
    }
</script>

<div class="max-w-5xl mx-auto py-8 space-y-8">
    <div>
        <h1 class="text-3xl font-bold text-gray-900 flex items-center">
            <Shield class="w-7 h-7 mr-2 text-indigo-600" />
            管理画面（モック）
        </h1>
        <p class="text-gray-500 mt-1">
            イベント状況の確認と告知配信のモックUIです。
        </p>
    </div>

    <section class="bg-white rounded-xl border border-gray-200 p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Calendar class="w-5 h-5 mr-2 text-indigo-600" />
            イベント管理
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {#each MOCK_EVENTS as event}
                <article class="rounded-lg border border-gray-200 p-4 bg-gray-50/60">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="font-bold text-gray-900">{event.title}</h3>
                        <span
                            class="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700"
                        >
                            {event.status === "published" ? "公開中" : event.status}
                        </span>
                    </div>
                    <p class="text-sm text-gray-600 mb-3">{event.summary}</p>
                    <a
                        href="/events/{event.id}"
                        class="text-sm text-indigo-600 hover:underline"
                    >
                        詳細を開く
                    </a>
                </article>
            {/each}
        </div>
    </section>

    <section class="bg-white rounded-xl border border-gray-200 p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Megaphone class="w-5 h-5 mr-2 text-indigo-600" />
            告知配信
        </h2>

        <div class="space-y-3">
            <input
                type="text"
                placeholder="告知タイトル"
                bind:value={title}
                class="w-full rounded-md border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
            <textarea
                rows="4"
                placeholder="告知本文"
                bind:value={body}
                class="w-full rounded-md border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
            ></textarea>
            <div class="flex flex-wrap items-center gap-3 text-sm">
                <label
                    for="announcement-target-type"
                    class="font-medium text-gray-700"
                    >配信先:</label
                >
                <select
                    id="announcement-target-type"
                    bind:value={targetType}
                    class="rounded-md border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                    <option value="all">全体</option>
                    <option value="event">イベント</option>
                </select>
                {#if targetType === "event"}
                    <select
                        bind:value={targetEventId}
                        class="rounded-md border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        {#each MOCK_EVENTS as event}
                            <option value={event.id}>{event.title}</option>
                        {/each}
                    </select>
                {/if}
            </div>
            {#if error}
                <p class="text-sm text-red-600">{error}</p>
            {/if}
            <div class="flex justify-end">
                <button
                    class="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700"
                    on:click={publishAnnouncement}
                >
                    <Send class="w-4 h-4 mr-1.5" />
                    告知を追加
                </button>
            </div>
        </div>
    </section>

    <section class="bg-white rounded-xl border border-gray-200 p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">告知履歴</h2>
        <div class="space-y-3">
            {#each announcements as announcement}
                <article class="rounded-lg border border-gray-100 p-4">
                    <div class="flex items-center justify-between gap-3 mb-1">
                        <h3 class="font-bold text-gray-900">{announcement.title}</h3>
                        <span class="text-xs text-gray-400 whitespace-nowrap">
                            {formatDate(announcement.publishedAt)}
                        </span>
                    </div>
                    <div class="text-xs text-indigo-600 font-medium mb-2">
                        配信先: {announcement.targetType === "all"
                            ? "全体"
                            : getEventTitle(announcement.eventId)}
                    </div>
                    <p class="text-sm text-gray-700">{announcement.body}</p>
                </article>
            {/each}
        </div>
    </section>
</div>
