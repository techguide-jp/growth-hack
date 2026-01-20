<script lang="ts">
    import { createEventDispatcher } from "svelte";

    export let activeTab = "overview";

    const dispatch = createEventDispatcher();

    const TABS = [
        { id: "overview", label: "概要" },
        { id: "updates", label: "更新(3)" },
        { id: "reviews", label: "レビュー(5)" },
        { id: "comments", label: "コメント" },
        { id: "help", label: "仲間募集" },
        { id: "support", label: "応援・支援" },
        { id: "chat", label: "会話" },
    ];

    function setTab(id: string) {
        activeTab = id;
        dispatch("change", id);
    }
</script>

<div class="border-b border-gray-200 mb-6">
    <nav class="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
        {#each TABS as tab}
            <button
                on:click={() => setTab(tab.id)}
                class="{activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
          whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors"
            >
                {tab.label}
            </button>
        {/each}
    </nav>
</div>
