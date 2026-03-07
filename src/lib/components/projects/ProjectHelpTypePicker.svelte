<script lang="ts">
    import type { ProjectHelpType } from "$lib/shared/domain";
    import { PROJECT_HELP_TYPE_OPTIONS } from "$lib/constants/project";

    interface Props {
        name?: string;
        value?: ProjectHelpType[];
        maxSelections?: number;
        invalid?: boolean;
        describedBy?: string | undefined;
    }

    let {
        name = "helpTypes",
        value = $bindable([]),
        maxSelections = 3,
        invalid = false,
        describedBy = undefined
    }: Props = $props();

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
    <div
        class="grid grid-cols-1 gap-3 rounded-2xl {invalid
            ? 'border border-rose-300 bg-rose-50/40 p-3'
            : 'border border-transparent'} sm:grid-cols-2"
    >
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
                onclick={() => toggle(option.value)}
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

    <input
        type="hidden"
        {name}
        value={value.join(",")}
        aria-invalid={invalid}
        aria-describedby={describedBy}
    />

    <p class="text-xs text-gray-500">
        今いちばん欲しい協力を1〜3件まで選択できます。
    </p>
</div>
