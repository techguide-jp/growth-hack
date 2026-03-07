import { eq } from "drizzle-orm";
import { getDb } from "$lib/server/db";
import { notificationSettings, userPreferences } from "$lib/server/db/schema";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  type NotificationSettingsPayload,
  type UserPreferencesState,
  type FocusMode,
} from "$lib/shared/settings";

const EMPTY_FOCUS_MODES: FocusMode[] = [];

function toUserPreferencesState(
  userId: string,
  record: typeof userPreferences.$inferSelect | null,
): UserPreferencesState {
  return {
    userId,
    focusModes: record?.focusModes ?? EMPTY_FOCUS_MODES,
    defaultLanding: (record?.defaultLanding as FocusMode | null) ?? null,
    onboardingCompletedAt: record?.onboardingCompletedAt?.toISOString() ?? null,
  };
}

function toNotificationSettingsPayload(
  record: typeof notificationSettings.$inferSelect | null,
): NotificationSettingsPayload {
  return {
    rules: record?.rules ?? DEFAULT_NOTIFICATION_SETTINGS.rules,
    digestFrequency:
      (record?.digestFrequency as NotificationSettingsPayload["digestFrequency"]) ??
      DEFAULT_NOTIFICATION_SETTINGS.digestFrequency,
  };
}

export function parseAdminEmails(value: string | undefined) {
  return new Set(
    (value ?? "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function provisionUserSettings(userId: string) {
  const db = getDb();

  await db
    .insert(userPreferences)
    .values({
      userId,
      focusModes: EMPTY_FOCUS_MODES,
      defaultLanding: null,
      onboardingCompletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoNothing();

  await db
    .insert(notificationSettings)
    .values({
      userId,
      rules: DEFAULT_NOTIFICATION_SETTINGS.rules,
      digestFrequency: DEFAULT_NOTIFICATION_SETTINGS.digestFrequency,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoNothing();
}

export async function getUserPreferencesState(userId: string) {
  const db = getDb();
  const [record] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  if (!record) {
    await provisionUserSettings(userId);
    const [nextRecord] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);
    return toUserPreferencesState(userId, nextRecord ?? null);
  }

  return toUserPreferencesState(userId, record);
}

export async function getNotificationSettingsState(userId: string) {
  const db = getDb();
  const [record] = await db
    .select()
    .from(notificationSettings)
    .where(eq(notificationSettings.userId, userId))
    .limit(1);

  if (!record) {
    await provisionUserSettings(userId);
    const [nextRecord] = await db
      .select()
      .from(notificationSettings)
      .where(eq(notificationSettings.userId, userId))
      .limit(1);
    return toNotificationSettingsPayload(nextRecord ?? null);
  }

  return toNotificationSettingsPayload(record);
}

export async function isUserOnboarded(userId: string) {
  const preferences = await getUserPreferencesState(userId);
  return preferences.onboardingCompletedAt !== null;
}

export async function updateUserPreferencesState(
  userId: string,
  input: {
    focusModes: FocusMode[];
    defaultLanding?: FocusMode | null;
  },
  options?: {
    markOnboardingComplete?: boolean;
  },
) {
  const current = await getUserPreferencesState(userId);
  const defaultLanding =
    input.defaultLanding !== undefined
      ? input.defaultLanding
      : current.defaultLanding &&
          input.focusModes.includes(current.defaultLanding)
        ? current.defaultLanding
        : (input.focusModes[0] ?? null);

  const onboardingCompletedAt = options?.markOnboardingComplete
    ? new Date()
    : current.onboardingCompletedAt
      ? new Date(current.onboardingCompletedAt)
      : null;

  const db = getDb();

  await db
    .insert(userPreferences)
    .values({
      userId,
      focusModes: input.focusModes,
      defaultLanding,
      onboardingCompletedAt,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: {
        focusModes: input.focusModes,
        defaultLanding,
        onboardingCompletedAt,
        updatedAt: new Date(),
      },
    });

  return getUserPreferencesState(userId);
}

export async function updateNotificationSettingsState(
  userId: string,
  input: NotificationSettingsPayload,
) {
  const db = getDb();

  await db
    .insert(notificationSettings)
    .values({
      userId,
      rules: input.rules,
      digestFrequency: input.digestFrequency,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: notificationSettings.userId,
      set: {
        rules: input.rules,
        digestFrequency: input.digestFrequency,
        updatedAt: new Date(),
      },
    });

  return getNotificationSettingsState(userId);
}
