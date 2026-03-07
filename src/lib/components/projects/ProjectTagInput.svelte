<script lang="ts">
    import { X } from "lucide-svelte";

    export let id = "tags";
    export let name = "tags";
    export let initialValue = "";
    export let placeholder = "タグを入力して Enter で追加";

    let tagInput = "";
    let isComposing = false;
    let lastInitialValue = initialValue;
    let tags = parseTags(initialValue);

    function parseTags(raw: string) {
        const seen = new Set<string>();

        return raw
            .split(/[,\n]/)
            .map((tag) => tag.trim())
            .filter((tag) => {
                if (tag.length === 0) {
                    return false;
                }

                const key = tag.toLowerCase();

                if (seen.has(key)) {
                    return false;
                }

                seen.add(key);
                return true;
            });
    }

    function syncFromProps(value: string) {
        tags = parseTags(value);
        tagInput = "";
        lastInitialValue = value;
    }

    function addTags(raw: string) {
        const nextTags = parseTags(`${tags.join(",")},${raw}`);

        if (nextTags.length === tags.length) {
            tagInput = "";
            return;
        }

        tags = nextTags;
        tagInput = "";
    }

    function removeTag(tagToRemove: string) {
        tags = tags.filter((tag) => tag !== tagToRemove);
    }

    function handleKeydown(event: KeyboardEvent) {
        if (isComposing) {
            return;
        }

        if (event.key === "Enter") {
            event.preventDefault();
            addTags(tagInput);
            return;
        }

        if (event.key === "Backspace" && tagInput.length === 0 && tags.length > 0) {
            event.preventDefault();
            tags = tags.slice(0, -1);
        }
    }

    function handleBlur() {
        addTags(tagInput);
    }

    $: if (initialValue !== lastInitialValue) {
        syncFromProps(initialValue);
    }
</script>

<div class="space-y-2">
    <div
        class="flex flex-wrap items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500"
    >
        {#each tags as tag (tag)}
            <span
                class="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700"
            >
                <span>{tag}</span>
                <button
                    type="button"
                    class="rounded-full text-indigo-500 hover:text-indigo-700"
                    aria-label={`${tag} を削除`}
                    on:click={() => removeTag(tag)}
                >
                    <X class="h-3.5 w-3.5" />
                </button>
            </span>
        {/each}

        <input
            id={id}
            type="text"
            bind:value={tagInput}
            class="min-w-[10rem] flex-1 border-0 p-0 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-0"
            placeholder={tags.length === 0 ? placeholder : "タグを追加"}
            on:keydown={handleKeydown}
            on:blur={handleBlur}
            on:compositionstart={() => (isComposing = true)}
            on:compositionend={() => (isComposing = false)}
        />
    </div>

    <input type="hidden" {name} value={tags.join(",")} />

    <p class="text-xs text-gray-500">
        入力して Enter で追加。不要なタグはチップ右の × で削除できます。
    </p>
</div>
