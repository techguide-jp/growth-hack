<script lang="ts">
    import { authClient } from "$lib/auth-client";

    export let data: { next: string };

    const next = data?.next ?? "/dashboard";
    let pendingProvider: "google" | "github" | null = null;
    let errorMessage = "";

    const loginOptions = [
        {
            label: "Googleで続ける",
            provider: "google" as const,
            color: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50",
        },
        {
            label: "GitHubで続ける",
            provider: "github" as const,
            color: "bg-black text-white hover:bg-gray-900",
        },
    ];

    async function handleSocialLogin(provider: "google" | "github") {
        if (pendingProvider) {
            return;
        }

        pendingProvider = provider;
        errorMessage = "";

        await authClient.signIn.social({
            provider,
            callbackURL: next,
            fetchOptions: {
                onError: (context) => {
                    errorMessage =
                        context.error.message ||
                        "ログインを開始できませんでした。";
                    pendingProvider = null;
                },
            },
        });

        pendingProvider = null;
    }
</script>

<div class="min-h-[80vh] flex items-center justify-center px-4">
    <div class="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">ログイン</h1>
        <p class="text-sm text-gray-500 mb-6">
            Google または GitHub のアカウントでログインしてください。
        </p>
        <div class="space-y-3">
            {#each loginOptions as option}
                <button
                    type="button"
                    class={`w-full inline-flex items-center justify-center rounded-lg px-4 py-3 font-semibold transition ${option.color}`}
                    disabled={pendingProvider !== null}
                    on:click={() => handleSocialLogin(option.provider)}
                >
                    {pendingProvider === option.provider
                        ? "リダイレクト中..."
                        : option.label}
                </button>
            {/each}
        </div>
        {#if errorMessage}
            <p class="mt-4 text-sm text-red-600">{errorMessage}</p>
        {/if}
    </div>
</div>
