<script lang="ts">
    import { MessageSquare } from "lucide-svelte";
</script>

<div class="max-w-3xl mx-auto py-10 text-center">
    <div
        class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-6"
    >
        <MessageSquare class="w-8 h-8 text-indigo-600" />
    </div>
    <h1 class="text-2xl font-bold text-gray-900 mb-2">メッセージ</h1>
    <p class="text-gray-500 mb-8">
        プロジェクトメンバーとの会話や、個別のDM機能は<br />現在開発中です
        (Mock)
    </p>

    <div
        class="bg-gray-50 rounded-lg p-6 text-left max-w-sm mx-auto border border-gray-200"
    >
        <h3 class="font-bold text-gray-700 mb-2 border-b pb-2">機能予定</h3>
        <ul class="list-disc list-inside text-sm text-gray-600 space-y-1">
            <li>個人DM (1対1)</li>
            <li>プロジェクトグループ会話</li>
            <li>未読管理</li>
        </ul>
    </div>
</div>
