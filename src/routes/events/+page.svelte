<script lang="ts">
    import { Calendar } from "lucide-svelte";
</script>

<div class="max-w-5xl mx-auto py-10">
    <div class="text-center mb-10">
        <h1 class="text-3xl font-bold text-gray-900 mb-4">イベント情報</h1>
        <p class="text-gray-500">
            ハッカソンやミートアップに参加して、開発のモチベーションを高めよう！
        </p>
    </div>

    <div
        class="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-60 grayscale filter hover:grayscale-0 hover:opacity-100 transition duration-500"
    >
        <div
            class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group hover:shadow-lg transition"
        >
            <div
                class="h-40 bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-2xl"
            >
                Tech Week 2024
            </div>
            <div class="p-6">
                <h3 class="font-bold text-xl mb-2">Tech Week Hackathon</h3>
                <p class="text-gray-600 text-sm mb-4">
                    1週間で最強のサービスを作ろう。豪華賞品あり。
                </p>
                <div class="flex items-center text-sm text-gray-500">
                    <Calendar class="w-4 h-4 mr-2" /> 2024/02/01 - 02/07
                </div>
            </div>
        </div>

        <div
            class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group hover:shadow-lg transition"
        >
            <div
                class="h-40 bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl"
            >
                Weekend Dev
            </div>
            <div class="p-6">
                <h3 class="font-bold text-xl mb-2">Weekend Game Jam</h3>
                <p class="text-gray-600 text-sm mb-4">
                    週末2日間でゲームを作り切るジャムイベント。
                </p>
                <div class="flex items-center text-sm text-gray-500">
                    <Calendar class="w-4 h-4 mr-2" /> 2024/02/10 - 02/11
                </div>
            </div>
        </div>
    </div>

    <p class="text-center mt-8 text-gray-400 text-sm">
        ※イベント機能は現在Mockです
    </p>
</div>
