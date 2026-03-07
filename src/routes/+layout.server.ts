import {
  getNotificationSettingsState,
  getUserPreferencesState,
} from "$lib/server/account-settings";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.user) {
    return {
      me: null,
      session: null,
      isOnboarded: false,
      preferences: null,
      notificationSettings: null,
    };
  }

  const [preferences, notificationSettings] = await Promise.all([
    getUserPreferencesState(locals.user.id),
    getNotificationSettingsState(locals.user.id),
  ]);

  return {
    me: locals.user,
    session: locals.session,
    isOnboarded: locals.isOnboarded,
    preferences,
    notificationSettings,
  };
};
