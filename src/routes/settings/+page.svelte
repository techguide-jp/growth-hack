<script lang="ts">
    import type {
        NotificationRuleId,
        NotificationSettingsPayload,
        UserPreferencesState,
    } from "$lib/shared/settings";
    import { notificationSettingsInputSchema } from "$lib/shared/settings";
    import { Bell, Save, Rocket, Heart, Users, Calendar } from "lucide-svelte";

    type NotificationRule = {
        id: NotificationRuleId;
        label: string;
        inApp: boolean;
        email: boolean;
    };

    export let data: {
        preferences: UserPreferencesState;
        notificationSettings: NotificationSettingsPayload;
    };

    export let form:
        | {
              intent?: "focus" | "notifications";
              success?: boolean;
              message?: string;
              values?: {
                  focusModes?: string[];
                  notificationSettings?: NotificationSettingsPayload | null;
              } | null;
          }
        | undefined;

    const MODES = [
        { id: "post", label: "作品を投稿したい", icon: Rocket },
        { id: "support", label: "応援したい", icon: Heart },
        { id: "collab", label: "仲間を見つけたい", icon: Users },
        { id: "event", label: "イベント情報を追いたい", icon: Calendar },
    ] as const;

    const notificationLabels: Record<NotificationRuleId, string> = {
        comment: "コメント",
        reaction: "リアクション",
        message: "メッセージ",
        support: "支援記録",
        announcement: "運営告知",
    };

    const parsedNotificationSettings = notificationSettingsInputSchema.safeParse(
        form?.values?.notificationSettings,
    );
    let selectedModes = [...(form?.values?.focusModes ?? data.preferences.focusModes)];
    let notificationSettings =
        parsedNotificationSettings.success
            ? parsedNotificationSettings.data
            : data.notificationSettings;

    $: serializedFocusModes = JSON.stringify(selectedModes);
    $: serializedNotificationSettings = JSON.stringify(notificationSettings);
    $: notificationRules = (
        Object.entries(notificationSettings.rules) as Array<
            [NotificationRuleId, NotificationSettingsPayload["rules"][NotificationRuleId]]
        >
    ).map(([id, rule]) => ({
        id,
        label: notificationLabels[id],
        inApp: rule.inApp,
        email: rule.email,
    }));
    $: focusSaved = form?.intent === "focus" && form?.success === true;
    $: notificationSaved =
        form?.intent === "notifications" && form?.success === true;
    $: focusError = form?.intent === "focus" ? form?.message ?? "" : "";
    $: notificationError =
        form?.intent === "notifications" ? form?.message ?? "" : "";

    function toggleMode(modeId: string) {
        if (selectedModes.includes(modeId)) {
            selectedModes = selectedModes.filter((id) => id !== modeId);
            return;
        }
        selectedModes = [...selectedModes, modeId];
    }

    function updateRule(index: number, channel: "inApp" | "email", value: boolean) {
        const target = notificationRules[index];
        if (!target) {
            return;
        }

        notificationSettings = {
            ...notificationSettings,
            rules: {
                ...notificationSettings.rules,
                [target.id]: {
                    ...notificationSettings.rules[target.id],
                    [channel]: value,
                },
            },
        };
    }
</script>

<div class="max-w-5xl mx-auto py-8 space-y-8">
    <div>
        <h1 class="text-3xl font-bold text-gray-900">設定</h1>
        <p class="text-gray-500 mt-1">
            フォーカスと通知設定を更新できます。
        </p>
    </div>

    <section class="bg-white rounded-xl border border-gray-200 p-6">
        <form method="POST">
            <input type="hidden" name="intent" value="focus" />
            <input type="hidden" name="focusModes" value={serializedFocusModes} />

            <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-bold text-gray-900">フォーカス設定</h2>
                <button
                    type="submit"
                    class="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700"
                >
                    <Save class="w-4 h-4 mr-1.5" />
                    保存
                </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                {#each MODES as mode}
                    <button
                        type="button"
                        class="flex items-center gap-3 px-4 py-3 border rounded-lg text-left transition-colors {selectedModes.includes(
                            mode.id,
                        )
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 hover:bg-gray-50'}"
                        on:click={() => toggleMode(mode.id)}
                    >
                        <svelte:component this={mode.icon} class="w-5 h-5" />
                        <span class="font-medium">{mode.label}</span>
                    </button>
                {/each}
            </div>

            {#if focusError}
                <p class="text-sm text-red-600 mt-3">{focusError}</p>
            {/if}
            {#if focusSaved}
                <p class="text-sm text-green-600 mt-3">フォーカス設定を保存しました。</p>
            {/if}
        </form>
    </section>

    <section class="bg-white rounded-xl border border-gray-200 p-6">
        <form method="POST">
            <input type="hidden" name="intent" value="notifications" />
            <input
                type="hidden"
                name="notificationSettings"
                value={serializedNotificationSettings}
            />

            <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-bold text-gray-900 flex items-center">
                    <Bell class="w-5 h-5 mr-2 text-indigo-600" />
                    通知設定
                </h2>
                <button
                    type="submit"
                    class="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700"
                >
                    <Save class="w-4 h-4 mr-1.5" />
                    保存
                </button>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="border-b border-gray-200 text-left text-gray-500">
                            <th class="py-2 pr-4 font-medium">通知種別</th>
                            <th class="py-2 pr-4 font-medium">アプリ内</th>
                            <th class="py-2 font-medium">メール</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each notificationRules as rule, index}
                            <tr class="border-b border-gray-100 last:border-b-0">
                                <td class="py-3 pr-4 font-medium text-gray-800">
                                    {rule.label}
                                </td>
                                <td class="py-3 pr-4">
                                    <input
                                        type="checkbox"
                                        checked={rule.inApp}
                                        on:change={(event) =>
                                            updateRule(
                                                index,
                                                "inApp",
                                                (event.currentTarget as HTMLInputElement)
                                                    .checked,
                                            )}
                                    />
                                </td>
                                <td class="py-3">
                                    <input
                                        type="checkbox"
                                        checked={rule.email}
                                        on:change={(event) =>
                                            updateRule(
                                                index,
                                                "email",
                                                (event.currentTarget as HTMLInputElement)
                                                    .checked,
                                            )}
                                    />
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>

            <div class="mt-6 flex flex-wrap items-center gap-3 text-sm">
                <span class="font-medium text-gray-700">将来のダイジェスト配信:</span>
                <select
                    bind:value={notificationSettings.digestFrequency}
                    class="rounded-md border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                    <option value="none">受け取らない（MVP）</option>
                    <option value="daily">日次（将来実装）</option>
                    <option value="weekly">週次（将来実装）</option>
                </select>
            </div>

            {#if notificationError}
                <p class="text-sm text-red-600 mt-3">{notificationError}</p>
            {/if}
            {#if notificationSaved}
                <p class="text-sm text-green-600 mt-3">
                    通知設定を保存しました。
                </p>
            {/if}
        </form>
    </section>
</div>
