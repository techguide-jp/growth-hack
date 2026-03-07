import { json, type RequestHandler } from "@sveltejs/kit";
import {
  getUserPreferencesState,
  updateUserPreferencesState,
} from "$lib/server/account-settings";
import { userPreferencesInputSchema } from "$lib/shared/settings";

export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user) {
    return json({ message: "Unauthorized" }, { status: 401 });
  }

  const preferences = await getUserPreferencesState(locals.user.id);
  return json(preferences);
};

export const PUT: RequestHandler = async ({ locals, request }) => {
  if (!locals.user) {
    return json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = userPreferencesInputSchema.safeParse(body);

  if (!parsed.success) {
    return json(
      { message: parsed.error.issues[0]?.message ?? "Invalid payload" },
      { status: 400 },
    );
  }

  const preferences = await updateUserPreferencesState(
    locals.user.id,
    parsed.data,
  );
  return json(preferences);
};
