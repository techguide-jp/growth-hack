<script lang="ts">
    import { page } from "$app/stores";
    import {
        Calendar,
        MapPin,
        Tag,
        MessageSquare,
        ArrowLeft,
    } from "lucide-svelte";
    import { MOCK_EVENTS } from "$lib/stores/mock/events";

    const POST_TYPE_LABEL: Record<string, string> = {
        progress: "進捗",
        question: "相談",
        showcase: "見せびらかし",
    };

    function formatDateTime(value: string) {
        return new Intl.DateTimeFormat("ja-JP", {
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(value));
    }

    function formatRange(startAt: string, endAt: string) {
        const formatter = new Intl.DateTimeFormat("ja-JP", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
        return `${formatter.format(new Date(startAt))} - ${formatter.format(new Date(endAt))}`;
    }

    $: eventId = $page.params.id ?? "";
    $: event = MOCK_EVENTS.find((item) => item.id === eventId);
    $: latestPosts = event
        ? [...event.roomPosts].sort(
              (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime(),
          )
        : [];
</script>

{#if event}
    <div class="max-w-5xl mx-auto space-y-8">
        <a
            href="/events"
            class="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
            <ArrowLeft class="w-4 h-4 mr-1" /> イベント一覧に戻る
        </a>

        <section
            class="rounded-2xl bg-gradient-to-r {event.visualClass} text-white p-8 shadow-lg"
        >
            <div class="flex items-center gap-2 text-sm opacity-90 mb-3">
                <Tag class="w-4 h-4" />
                {#each event.tags as tag, index}
                    <span>{tag}</span>{#if index < event.tags.length - 1}<span
                            >・</span
                        >{/if}
                {/each}
            </div>
            <h1 class="text-3xl font-extrabold mb-3">{event.title}</h1>
            <p class="text-white/90 mb-6">{event.summary}</p>
            <div class="grid gap-2 text-sm md:grid-cols-2">
                <div class="flex items-center">
                    <Calendar class="w-4 h-4 mr-2" />
                    {formatRange(event.startAt, event.endAt)}
                </div>
                <div class="flex items-center">
                    <MapPin class="w-4 h-4 mr-2" />
                    {event.location}
                </div>
            </div>
        </section>

        <section class="bg-white rounded-xl border border-gray-200 p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-3">イベント概要</h2>
            <p class="text-gray-700 leading-7">{event.description}</p>
        </section>

        <section class="bg-white rounded-xl border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-bold text-gray-900 flex items-center">
                    <MessageSquare class="w-5 h-5 mr-2 text-indigo-600" />
                    イベントルーム（モック）
                </h2>
                <a
                    href="/timeline"
                    class="text-sm text-indigo-600 hover:text-indigo-500"
                >
                    タイムライン全体へ
                </a>
            </div>
            <div class="space-y-3">
                {#each latestPosts as post}
                    <article
                        class="rounded-lg border border-gray-100 bg-gray-50 p-4"
                    >
                        <div
                            class="flex items-center justify-between text-xs text-gray-500 mb-1"
                        >
                            <div class="font-medium text-gray-700">
                                {post.authorName}
                            </div>
                            <div>{formatDateTime(post.createdAt)}</div>
                        </div>
                        <div class="text-xs font-semibold text-indigo-600 mb-2">
                            {POST_TYPE_LABEL[post.type]}
                        </div>
                        <p class="text-sm text-gray-800">{post.body}</p>
                    </article>
                {/each}
            </div>
        </section>
    </div>
{:else}
    <div class="max-w-3xl mx-auto py-16 text-center">
        <h1 class="text-2xl font-bold text-gray-700 mb-3">
            イベントが見つかりませんでした
        </h1>
        <a href="/events" class="text-indigo-600 hover:underline"
            >イベント一覧に戻る</a
        >
    </div>
{/if}
