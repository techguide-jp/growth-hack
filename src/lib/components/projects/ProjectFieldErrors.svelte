<script lang="ts">
    export let id: string | undefined = undefined;
    export let errors: string[] = [];
</script>

{#if errors.length > 0}
    <ul {id} class="space-y-1 text-sm text-rose-700" aria-live="polite">
        {#each errors as error}
            <li class="flex items-start gap-2">
                <span class="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                <span>{error}</span>
            </li>
        {/each}
    </ul>
{/if}
