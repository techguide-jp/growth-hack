<script lang="ts">
    import { api, currentUser, userPreferences } from "$lib/stores/mock";
    import { goto } from "$app/navigation";
    import { Rocket, Heart, Users, Calendar } from "lucide-svelte";

    let selectedErrors = false;
    let selectedModes: string[] = [];

    $: prefs = $userPreferences.find((p) => p.userId === $currentUser?.id);
    $: if (prefs && selectedModes.length === 0) {
        // Pre-fill if exists
        selectedModes = [...prefs.focusModes];
    }

    const MODES = [
        {
            id: "post",
            label: "作品を投稿したい",
            icon: Rocket,
            desc: "自分の作ったものを公開してフィードバックをもらう",
        },
        {
            id: "support",
            label: "応援したい",
            icon: Heart,
            desc: "面白い作品を見つけてリアクションや支援をする",
        },
        {
            id: "collab",
            label: "仲間を見つけたい",
            icon: Users,
            desc: "一緒に開発するメンバーや相談相手を探す",
        },
        {
            id: "event",
            label: "イベントを楽しむ",
            icon: Calendar,
            desc: "開催中のハッカソンやイベント情報を追う",
        },
    ];

    function toggle(id: string) {
        if (selectedModes.includes(id)) {
            selectedModes = selectedModes.filter((m) => m !== id);
        } else {
            selectedModes = [...selectedModes, id];
        }
    }

    function handleSave() {
        if (selectedModes.length === 0) {
            selectedErrors = true;
            return;
        }
        if ($currentUser) {
            api.updateFocusModes($currentUser.id, selectedModes);
            goto("/");
        }
    }
</script>

<div class="min-h-[80vh] flex flex-col items-center justify-center p-4">
    <div class="max-w-2xl w-full text-center mb-10">
        <h1 class="text-3xl font-extrabold text-gray-900 mb-4">
            Growth Hachへようこそ！
        </h1>
        <p class="text-lg text-gray-600">
            あなたがこのコミュニティでやりたいことは何ですか？（複数選択可）
        </p>
        <p class="text-sm text-gray-500 mt-2">
            ※選択によってホーム画面の表示順が変わります（後で変更可）
        </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl mb-10">
        {#each MODES as mode}
            <button
                class="relative flex flex-col items-center p-6 rounded-2xl border-2 transition-all duration-200 text-left hover:shadow-lg {selectedModes.includes(
                    mode.id,
                )
                    ? 'border-indigo-600 bg-indigo-50/50'
                    : 'border-gray-200 bg-white hover:border-indigo-300'}"
                on:click={() => toggle(mode.id)}
            >
                <div class="bg-white p-3 rounded-full shadow-sm mb-4">
                    <svelte:component
                        this={mode.icon}
                        class="w-8 h-8 {selectedModes.includes(mode.id)
                            ? 'text-indigo-600'
                            : 'text-gray-400'}"
                    />
                </div>
                <h3 class="text-lg font-bold text-gray-900 mb-2">
                    {mode.label}
                </h3>
                <p class="text-sm text-gray-500 text-center">{mode.desc}</p>

                {#if selectedModes.includes(mode.id)}
                    <div
                        class="absolute top-4 right-4 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center"
                    >
                        <svg
                            class="w-4 h-4 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            ><path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="3"
                                d="M5 13l4 4L19 7"
                            /></svg
                        >
                    </div>
                {/if}
            </button>
        {/each}
    </div>

    {#if selectedErrors}
        <p class="text-red-500 font-bold mb-4">少なくとも1つ選択してください</p>
    {/if}

    <button
        class="w-full max-w-xs py-4 px-8 bg-indigo-600 text-white rounded-full text-xl font-bold shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all"
        on:click={handleSave}
    >
        はじめる
    </button>
</div>
