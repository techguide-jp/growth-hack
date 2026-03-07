<script lang="ts">
    import type { ProjectHelpType } from "$lib/shared/domain";
    import { PROJECT_HELP_TYPE_OPTIONS } from "$lib/constants/project";

    export let name = "helpTypes";
    export let value: ProjectHelpType[] = [];
    export let maxSelections = 3;

    function toggle(option: ProjectHelpType) {
        if (value.includes(option)) {
            value = value.filter((item) => item !== option);
            return;
        }

        if (value.length >= maxSelections) {
            return;
        }

        value = [...value, option];
    }
</script>

<div class="space-y-3">
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {#each PROJECT_HELP_TYPE_OPTIONS as option}
            {@const selected = value.includes(option.value)}
            {@const disabled = !selected && value.length >= maxSelections}
            <button
                type="button"
                class="rounded-xl border p-4 text-left transition {selected
                    ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'} {disabled
                    ? 'cursor-not-allowed opacity-60'
                    : ''}"
                on:click={() => toggle(option.value)}
                aria-pressed={selected}
                disabled={disabled}
            >
                <div class="flex items-center justify-between gap-3">
                    <div class="font-bold text-gray-900">{option.label}</div>
                    <span
                        class="rounded-full px-2 py-0.5 text-xs font-bold {selected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-500'}"
                    >
                        {selected ? "選択中" : "選択"}
                    </span>
                </div>
                <p class="mt-2 text-sm text-gray-600">{option.description}</p>
            </button>
        {/each}
    </div>

    <input type="hidden" {name} value={value.join(",")} />

    <p class="text-xs text-gray-500">
        今いちばん欲しい協力を1〜3件まで選択できます。
    </p>
</div>
