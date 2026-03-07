import { z } from "zod";

export const FOCUS_MODE_VALUES = [
  "post",
  "support",
  "collab",
  "event",
] as const;
export const NOTIFICATION_RULE_ID_VALUES = [
  "comment",
  "reaction",
  "message",
  "support",
  "announcement",
] as const;
export const DIGEST_FREQUENCY_VALUES = ["none", "daily", "weekly"] as const;

export type FocusMode = (typeof FOCUS_MODE_VALUES)[number];
export type NotificationRuleId = (typeof NOTIFICATION_RULE_ID_VALUES)[number];
export type DigestFrequency = (typeof DIGEST_FREQUENCY_VALUES)[number];

export type NotificationRulePreference = {
  inApp: boolean;
  email: boolean;
};

export type NotificationRuleMap = Record<
  NotificationRuleId,
  NotificationRulePreference
>;

export type NotificationSettingsPayload = {
  rules: NotificationRuleMap;
  digestFrequency: DigestFrequency;
};

export type UserPreferencesState = {
  userId: string;
  focusModes: FocusMode[];
  defaultLanding: FocusMode | null;
  onboardingCompletedAt: string | null;
};

export const notificationRulePreferenceSchema = z.object({
  inApp: z.boolean(),
  email: z.boolean(),
});

export const focusModeSchema = z.enum(FOCUS_MODE_VALUES);
export const defaultLandingSchema = focusModeSchema.nullable();
export const digestFrequencySchema = z.enum(DIGEST_FREQUENCY_VALUES);

export const focusModesSchema = z
  .array(focusModeSchema)
  .min(1, "少なくとも1つ選択してください。")
  .max(FOCUS_MODE_VALUES.length)
  .refine((values) => new Set(values).size === values.length, {
    message: "重複したモードは保存できません。",
  });

export const notificationRuleMapSchema = z.object({
  comment: notificationRulePreferenceSchema,
  reaction: notificationRulePreferenceSchema,
  message: notificationRulePreferenceSchema,
  support: notificationRulePreferenceSchema,
  announcement: notificationRulePreferenceSchema,
});

export const notificationSettingsSchema = z.object({
  rules: notificationRuleMapSchema,
  digestFrequency: digestFrequencySchema,
});

export const userPreferencesInputSchema = z.object({
  focusModes: focusModesSchema,
  defaultLanding: defaultLandingSchema.optional(),
});

export const notificationSettingsInputSchema = notificationSettingsSchema;

export const DEFAULT_NOTIFICATION_RULES: NotificationRuleMap = {
  comment: { inApp: true, email: true },
  reaction: { inApp: true, email: false },
  message: { inApp: true, email: true },
  support: { inApp: true, email: true },
  announcement: { inApp: true, email: true },
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettingsPayload = {
  rules: DEFAULT_NOTIFICATION_RULES,
  digestFrequency: "none",
};
