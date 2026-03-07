import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import {
  getUserPreferencesState,
  updateUserPreferencesState,
} from "$lib/server/account-settings";
import { requireUser } from "$lib/server/auth/guards";
import { sanitizeNextPath } from "$lib/shared/navigation";
import { focusModesSchema } from "$lib/shared/settings";

export const load: PageServerLoad = async (event) => {
  const user = requireUser(event);
  const next = sanitizeNextPath(event.url.searchParams.get("next"));

  if (event.locals.isOnboarded) {
    throw redirect(302, next);
  }

  return {
    next,
    preferences: await getUserPreferencesState(user.id),
  };
};

export const actions: Actions = {
  default: async (event) => {
    const user = requireUser(event);
    const formData = await event.request.formData();
    const rawFocusModes = formData.get("focusModes");
    const next = formData.get("next");

    if (typeof rawFocusModes !== "string") {
      return fail(400, {
        message: "モードの送信形式が不正です。",
        values: { focusModes: [] },
      });
    }

    let parsedJson: unknown;

    try {
      parsedJson = JSON.parse(rawFocusModes) as unknown;
    } catch {
      return fail(400, {
        message: "モードの送信形式が不正です。",
        values: { focusModes: [] },
      });
    }

    const parsedModes = focusModesSchema.safeParse(parsedJson);

    if (!parsedModes.success) {
      return fail(400, {
        message:
          parsedModes.error.issues[0]?.message ??
          "入力内容を確認してください。",
        values: {
          focusModes: Array.isArray(parsedJson) ? parsedJson : [],
        },
      });
    }

    await updateUserPreferencesState(
      user.id,
      {
        focusModes: parsedModes.data,
      },
      {
        markOnboardingComplete: true,
      },
    );

    throw redirect(
      303,
      typeof next === "string" ? sanitizeNextPath(next) : "/",
    );
  },
};
