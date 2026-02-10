<script lang="ts">
    import { Calendar, MapPin, ArrowRight } from "lucide-svelte";
    import { MOCK_EVENTS } from "$lib/stores/mock/events";

    function formatPeriod(startAt: string, endAt: string) {
        const start = new Date(startAt);
        const end = new Date(endAt);
        const date = new Intl.DateTimeFormat("ja-JP", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
        return `${date.format(start)} - ${date.format(end)}`;
    }

    function statusLabel(status: "draft" | "published" | "ended") {
        if (status === "draft") return "下書き";
        if (status === "ended") return "終了";
        return "公開中";
    }
</script>

<div class="max-w-5xl mx-auto py-10">
    <div class="text-center mb-10">
        <h1 class="text-3xl font-bold text-gray-900 mb-4">イベント情報</h1>
        <p class="text-gray-500">
            進行中のイベントを確認して、ルームで進捗や相談を投稿できます。
        </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        {#each MOCK_EVENTS as event}
            <a
                href="/events/{event.id}"
                class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group hover:shadow-lg transition"
            >
                <div
                    class="h-40 bg-gradient-to-r {event.visualClass} flex items-center justify-between px-6 text-white"
                >
                    <div>
                        <div class="text-xs opacity-90 mb-1">
                            {statusLabel(event.status)}
                        </div>
                        <div class="font-bold text-2xl">{event.shortTitle}</div>
                    </div>
                    <ArrowRight
                        class="w-6 h-6 opacity-80 group-hover:translate-x-1 transition-transform"
                    />
                </div>

                <div class="p-6">
                    <h3 class="font-bold text-xl mb-2">{event.title}</h3>
                    <p class="text-gray-600 text-sm mb-4">{event.summary}</p>
                    <div class="space-y-2 text-sm text-gray-500">
                        <div class="flex items-center">
                            <Calendar class="w-4 h-4 mr-2" />
                            {formatPeriod(event.startAt, event.endAt)}
                        </div>
                        <div class="flex items-center">
                            <MapPin class="w-4 h-4 mr-2" />
                            {event.location}
                        </div>
                    </div>
                </div>
            </a>
        {/each}
    </div>

    {#if MOCK_EVENTS.length === 0}
        <div class="text-center mt-8 text-gray-400 text-sm">
            現在公開中のイベントはありません。
        </div>
    {/if}
</div>
