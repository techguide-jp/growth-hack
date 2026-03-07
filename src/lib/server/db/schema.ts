import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { FocusMode, NotificationRuleMap } from "$lib/shared/settings";

export const userRole = pgEnum("user_role", ["user", "admin"]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  role: userRole("role").notNull().default("user"),
  emailVerified: boolean("email_verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    token: text("token").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdIndex: index("sessions_user_id_idx").on(table.userId),
  }),
);

export const accounts = pgTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    providerAccountIndex: uniqueIndex("accounts_provider_account_uidx").on(
      table.providerId,
      table.accountId,
    ),
    userIdIndex: index("accounts_user_id_idx").on(table.userId),
  }),
);

export const verifications = pgTable(
  "verifications",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    identifierIndex: index("verifications_identifier_idx").on(table.identifier),
  }),
);

export const userPreferences = pgTable("user_preferences", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  focusModes: jsonb("focus_modes")
    .$type<FocusMode[]>()
    .notNull()
    .default(sql.raw(`'[]'::jsonb`)),
  defaultLanding: text("default_landing").$type<FocusMode | null>(),
  onboardingCompletedAt: timestamp("onboarding_completed_at", {
    withTimezone: true,
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const notificationSettings = pgTable("notification_settings", {
  userId: text("user_id")
    .primaryKey()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  rules: jsonb("rules")
    .$type<NotificationRuleMap>()
    .notNull()
    .default(
      sql.raw(
        `'{"comment":{"inApp":true,"email":true},"reaction":{"inApp":true,"email":false},"message":{"inApp":true,"email":true},"support":{"inApp":true,"email":true},"announcement":{"inApp":true,"email":true}}'::jsonb`,
      ),
    ),
  digestFrequency: text("digest_frequency")
    .$type<"none" | "daily" | "weekly">()
    .notNull()
    .default("none"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type AuthUser = typeof users.$inferSelect;
export type AuthSession = typeof sessions.$inferSelect;
export type AuthAccount = typeof accounts.$inferSelect;
export type AuthVerification = typeof verifications.$inferSelect;
export type UserPreferencesRecord = typeof userPreferences.$inferSelect;
export type NotificationSettingsRecord =
  typeof notificationSettings.$inferSelect;
