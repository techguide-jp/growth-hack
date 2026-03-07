import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import {
  getNotificationSettingsState,
  getUserPreferencesState,
  updateNotificationSettingsState,
  updateUserPreferencesState,
} from "$lib/server/account-settings";
import { requireOnboarded } from "$lib/server/auth/guards";
import {
  focusModesSchema,
  notificationSettingsInputSchema,
} from "$lib/shared/settings";

export const load: PageServerLoad = async (event) => {
  const user = requireOnboarded(event);

  const [preferences, notificationSettings] = await Promise.all([
    getUserPreferencesState(user.id),
    getNotificationSettingsState(user.id),
  ]);

  return {
    preferences,
    notificationSettings,
  };
};

export const actions: Actions = {
  default: async (event) => {
    const user = requireOnboarded(event);
    const formData = await event.request.formData();
    const intent = formData.get("intent");

    if (intent === "focus") {
      const rawFocusModes = formData.get("focusModes");

      if (typeof rawFocusModes !== "string") {
        return fail(400, {
          intent: "focus",
          message: "モードの送信形式が不正です。",
          values: { focusModes: [] },
        });
      }

      let parsedJson: unknown;

      try {
        parsedJson = JSON.parse(rawFocusModes) as unknown;
      } catch {
        return fail(400, {
          intent: "focus",
          message: "モードの送信形式が不正です。",
          values: { focusModes: [] },
        });
      }

      const parsedModes = focusModesSchema.safeParse(parsedJson);

      if (!parsedModes.success) {
        return fail(400, {
          intent: "focus",
          message:
            parsedModes.error.issues[0]?.message ??
            "入力内容を確認してください。",
          values: {
            focusModes: Array.isArray(parsedJson) ? parsedJson : [],
          },
        });
      }

      await updateUserPreferencesState(user.id, {
        focusModes: parsedModes.data,
      });

      return {
        intent: "focus",
        success: true,
      };
    }

    if (intent === "notifications") {
      const rawPayload = formData.get("notificationSettings");

      if (typeof rawPayload !== "string") {
        return fail(400, {
          intent: "notifications",
          message: "通知設定の送信形式が不正です。",
          values: null,
        });
      }

      let parsedJson: unknown;

      try {
        parsedJson = JSON.parse(rawPayload) as unknown;
      } catch {
        return fail(400, {
          intent: "notifications",
          message: "通知設定の送信形式が不正です。",
          values: null,
        });
      }

      const parsedPayload =
        notificationSettingsInputSchema.safeParse(parsedJson);

      if (!parsedPayload.success) {
        return fail(400, {
          intent: "notifications",
          message:
            parsedPayload.error.issues[0]?.message ??
            "通知設定を確認してください。",
          values: {
            notificationSettings: await getNotificationSettingsState(user.id),
          },
        });
      }

      await updateNotificationSettingsState(user.id, parsedPayload.data);

      return {
        intent: "notifications",
        success: true,
      };
    }

    return fail(400, {
      message: "不正な操作です。",
    });
  },
};
