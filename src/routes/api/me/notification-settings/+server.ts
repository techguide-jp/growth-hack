import { json, type RequestHandler } from "@sveltejs/kit";
import {
  getNotificationSettingsState,
  updateNotificationSettingsState,
} from "$lib/server/account-settings";
import { notificationSettingsInputSchema } from "$lib/shared/settings";

export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user) {
    return json({ message: "Unauthorized" }, { status: 401 });
  }

  const settings = await getNotificationSettingsState(locals.user.id);
  return json(settings);
};

export const PUT: RequestHandler = async ({ locals, request }) => {
  if (!locals.user) {
    return json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = notificationSettingsInputSchema.safeParse(body);

  if (!parsed.success) {
    return json(
      { message: parsed.error.issues[0]?.message ?? "Invalid payload" },
      { status: 400 },
    );
  }

  const settings = await updateNotificationSettingsState(
    locals.user.id,
    parsed.data,
  );
  return json(settings);
};
