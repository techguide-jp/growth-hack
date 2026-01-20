<script lang="ts">
    import { Bell } from "lucide-svelte";
</script>

<div class="max-w-3xl mx-auto py-10 text-center">
    <div
        class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mb-6"
    >
        <Bell class="w-8 h-8 text-orange-600" />
    </div>
    <h1 class="text-2xl font-bold text-gray-900 mb-2">通知</h1>
    <p class="text-gray-500 mb-8">
        あなたへのリアクションやコメントのお知らせです。<br />(Mock)
    </p>

    <div class="space-y-4 text-left max-w-md mx-auto">
        <!-- Mock Rows -->
        <div
            class="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex gap-3 opacity-60"
        >
            <div class="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
            <div>
                <p class="text-sm font-bold text-gray-900">
                    Aliceさんがあなたの投稿にコメントしました
                </p>
                <p class="text-xs text-gray-500">2時間前</p>
            </div>
        </div>
        <div
            class="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex gap-3 opacity-60"
        >
            <div class="w-2 h-2 rounded-full bg-gray-300 mt-2"></div>
            <div>
                <p class="text-sm font-bold text-gray-900">
                    Bobさんがあなたのプロジェクトに「アツい」リアクションをしました
                </p>
                <p class="text-xs text-gray-500">5時間前</p>
            </div>
        </div>
    </div>
</div>
