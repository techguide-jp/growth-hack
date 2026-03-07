import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import {
  ANNOUNCEMENT_TARGET_TYPE_VALUES,
  COMMENT_TARGET_TYPE_VALUES,
  CONVERSATION_TYPE_VALUES,
  EMAIL_OUTBOX_STATUS_VALUES,
  EVENT_STATUS_VALUES,
  FOLLOW_TARGET_TYPE_VALUES,
  HELP_WANTED_STATUS_VALUES,
  JOIN_REQUEST_STATUS_VALUES,
  PROJECT_MEMBER_ROLE_VALUES,
  PROJECT_STAGE_VALUES,
  PROJECT_STATUS_VALUES,
  PROJECT_HELP_TYPE_VALUES,
  REACTION_KIND_VALUES,
  REACTION_TARGET_TYPE_VALUES,
  SUPPORT_RECORD_STATUS_VALUES,
  TIMELINE_POST_STATUS_VALUES,
  TIMELINE_POST_TYPE_VALUES,
  TIMELINE_VISIBILITY_VALUES,
  type ProjectHelpType,
  type ProjectStage,
  type TimelineQuestionMeta,
} from "../../shared/domain.ts";
import { USER_ROLE_VALUES } from "../../shared/session.ts";
import type {
  FocusMode,
  NotificationRuleMap,
} from "../../shared/settings.ts";

type JsonPayload = Record<string, unknown>;

export const userRole = pgEnum("user_role", USER_ROLE_VALUES);
export const eventStatus = pgEnum("event_status", EVENT_STATUS_VALUES);
export const announcementTargetType = pgEnum(
  "announcement_target_type",
  ANNOUNCEMENT_TARGET_TYPE_VALUES,
);
export const projectStatus = pgEnum("project_status", PROJECT_STATUS_VALUES);
export const projectStage = pgEnum("project_stage", PROJECT_STAGE_VALUES);
export const projectMemberRole = pgEnum(
  "project_member_role",
  PROJECT_MEMBER_ROLE_VALUES,
);
export const commentTargetType = pgEnum(
  "comment_target_type",
  COMMENT_TARGET_TYPE_VALUES,
);
export const reactionTargetType = pgEnum(
  "reaction_target_type",
  REACTION_TARGET_TYPE_VALUES,
);
export const reactionKind = pgEnum("reaction_kind", REACTION_KIND_VALUES);
export const followTargetType = pgEnum(
  "follow_target_type",
  FOLLOW_TARGET_TYPE_VALUES,
);
export const supportRecordStatus = pgEnum(
  "support_record_status",
  SUPPORT_RECORD_STATUS_VALUES,
);
export const helpWantedStatus = pgEnum(
  "help_wanted_status",
  HELP_WANTED_STATUS_VALUES,
);
export const joinRequestStatus = pgEnum(
  "join_request_status",
  JOIN_REQUEST_STATUS_VALUES,
);
export const conversationType = pgEnum(
  "conversation_type",
  CONVERSATION_TYPE_VALUES,
);
export const timelinePostType = pgEnum(
  "timeline_post_type",
  TIMELINE_POST_TYPE_VALUES,
);
export const timelinePostStatus = pgEnum(
  "timeline_post_status",
  TIMELINE_POST_STATUS_VALUES,
);
export const timelineVisibility = pgEnum(
  "timeline_visibility",
  TIMELINE_VISIBILITY_VALUES,
);
export const emailOutboxStatus = pgEnum(
  "email_outbox_status",
  EMAIL_OUTBOX_STATUS_VALUES,
);

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

export const projects = pgTable(
  "projects",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    problemStatement: text("problem_statement").notNull().default(""),
    projectStage: projectStage("project_stage").$type<ProjectStage | null>(),
    helpTypes: jsonb("help_types")
      .$type<ProjectHelpType[]>()
      .notNull()
      .default(sql.raw(`'[]'::jsonb`)),
    helpRequest: text("help_request").notNull().default(""),
    highlights: jsonb("highlights")
      .$type<string[]>()
      .notNull()
      .default(sql.raw(`'[]'::jsonb`)),
    nextMilestone: text("next_milestone").notNull().default(""),
    feedbackRequest: text("feedback_request").notNull().default(""),
    description: text("description").notNull(),
    publicUrl: text("public_url"),
    repoUrl: text("repo_url"),
    demoUrl: text("demo_url"),
    status: projectStatus("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    ownerStatusIndex: index("projects_owner_status_idx").on(
      table.ownerUserId,
      table.status,
    ),
    updatedAtIndex: index("projects_updated_at_idx").on(table.updatedAt),
  }),
);

export const userPresence = pgTable(
  "user_presence",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    statusText: text("status_text"),
    nowProjectId: text("now_project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    lastSeenAtIndex: index("user_presence_last_seen_at_idx").on(table.lastSeenAt),
  }),
);

export const events = pgTable(
  "events",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    status: eventStatus("status").notNull().default("draft"),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    approvedByAdminId: text("approved_by_admin_id").references(() => users.id, {
      onDelete: "set null",
    }),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    statusStartAtIndex: index("events_status_start_at_idx").on(
      table.status,
      table.startAt,
    ),
    createdByIndex: index("events_created_by_user_id_idx").on(
      table.createdByUserId,
    ),
  }),
);

export const announcements = pgTable(
  "announcements",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    targetType: announcementTargetType("target_type").notNull(),
    eventId: text("event_id").references(() => events.id, {
      onDelete: "set null",
    }),
    publishedAt: timestamp("published_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => ({
    targetTypeIndex: index("announcements_target_type_idx").on(table.targetType),
    publishedAtIndex: index("announcements_published_at_idx").on(
      table.publishedAt,
    ),
  }),
);

export const projectEvents = pgTable(
  "project_events",
  {
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.projectId, table.eventId],
      name: "project_events_pk",
    }),
    eventIdIndex: index("project_events_event_id_idx").on(table.eventId),
  }),
);

export const projectMembers = pgTable(
  "project_members",
  {
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    memberRole: projectMemberRole("member_role").notNull().default("contributor"),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.projectId, table.userId],
      name: "project_members_pk",
    }),
    userIdIndex: index("project_members_user_id_idx").on(table.userId),
  }),
);

export const tags = pgTable("tags", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const projectTags = pgTable(
  "project_tags",
  {
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.projectId, table.tagId],
      name: "project_tags_pk",
    }),
    tagIdIndex: index("project_tags_tag_id_idx").on(table.tagId),
  }),
);

export const projectScreenshots = pgTable(
  "project_screenshots",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    imageUrl: text("image_url").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    projectSortIndex: index("project_screenshots_project_sort_idx").on(
      table.projectId,
      table.sortOrder,
    ),
  }),
);

export const updates = pgTable(
  "updates",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    authorUserId: text("author_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    projectPublishedAtIndex: index("updates_project_published_at_idx").on(
      table.projectId,
      table.publishedAt,
    ),
  }),
);

export const comments = pgTable(
  "comments",
  {
    id: text("id").primaryKey(),
    targetType: commentTargetType("target_type").notNull(),
    targetId: text("target_id").notNull(),
    authorUserId: text("author_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    targetCreatedAtIndex: index("comments_target_created_at_idx").on(
      table.targetType,
      table.targetId,
      table.createdAt,
    ),
    authorIndex: index("comments_author_user_id_idx").on(table.authorUserId),
  }),
);

export const reviews = pgTable(
  "reviews",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    authorUserId: text("author_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    projectCreatedAtIndex: index("reviews_project_created_at_idx").on(
      table.projectId,
      table.createdAt,
    ),
    authorProjectIndex: uniqueIndex("reviews_author_project_uidx").on(
      table.projectId,
      table.authorUserId,
    ),
  }),
);

export const reactions = pgTable(
  "reactions",
  {
    id: text("id").primaryKey(),
    targetType: reactionTargetType("target_type").notNull(),
    targetId: text("target_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: reactionKind("kind").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    uniqueReactionIndex: uniqueIndex("reactions_target_user_kind_uidx").on(
      table.targetType,
      table.targetId,
      table.userId,
      table.kind,
    ),
    userIdIndex: index("reactions_user_id_idx").on(table.userId),
  }),
);

export const follows = pgTable(
  "follows",
  {
    followerUserId: text("follower_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetType: followTargetType("target_type").notNull(),
    targetId: text("target_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.followerUserId, table.targetType, table.targetId],
      name: "follows_pk",
    }),
    targetIndex: index("follows_target_idx").on(table.targetType, table.targetId),
  }),
);

export const supportLinks = pgTable(
  "support_links",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    url: text("url").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    projectIdIndex: index("support_links_project_id_idx").on(table.projectId),
  }),
);

export const supportRecords = pgTable(
  "support_records",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    supporterUserId: text("supporter_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amountJpy: integer("amount_jpy").notNull(),
    message: text("message"),
    externalReference: text("external_reference"),
    status: supportRecordStatus("status").notNull().default("awaiting_owner"),
    ownerConfirmedAt: timestamp("owner_confirmed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    projectStatusIndex: index("support_records_project_status_idx").on(
      table.projectId,
      table.status,
    ),
    supporterIndex: index("support_records_supporter_user_id_idx").on(
      table.supporterUserId,
    ),
  }),
);

export const helpWanted = pgTable(
  "help_wanted",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    detail: text("detail").notNull(),
    skills: jsonb("skills")
      .$type<string[]>()
      .notNull()
      .default(sql.raw(`'[]'::jsonb`)),
    status: helpWantedStatus("status").notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    projectStatusIndex: index("help_wanted_project_status_idx").on(
      table.projectId,
      table.status,
    ),
  }),
);

export const joinRequests = pgTable(
  "join_requests",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    applicantUserId: text("applicant_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    message: text("message").notNull(),
    status: joinRequestStatus("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    projectStatusIndex: index("join_requests_project_status_idx").on(
      table.projectId,
      table.status,
    ),
    applicantIndex: uniqueIndex("join_requests_project_applicant_uidx").on(
      table.projectId,
      table.applicantUserId,
    ),
  }),
);

export const conversations = pgTable(
  "conversations",
  {
    id: text("id").primaryKey(),
    type: conversationType("type").notNull(),
    projectId: text("project_id").references(() => projects.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    projectIdIndex: index("conversations_project_id_idx").on(table.projectId),
  }),
);

export const conversationMembers = pgTable(
  "conversation_members",
  {
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.conversationId, table.userId],
      name: "conversation_members_pk",
    }),
    userIdIndex: index("conversation_members_user_id_idx").on(table.userId),
  }),
);

export const messages = pgTable(
  "messages",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderUserId: text("sender_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    conversationCreatedAtIndex: index("messages_conversation_created_at_idx").on(
      table.conversationId,
      table.createdAt,
    ),
    senderIndex: index("messages_sender_user_id_idx").on(table.senderUserId),
  }),
);

export const messageReads = pgTable(
  "message_reads",
  {
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lastReadAt: timestamp("last_read_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastReadMessageId: text("last_read_message_id").references(() => messages.id, {
      onDelete: "set null",
    }),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.conversationId, table.userId],
      name: "message_reads_pk",
    }),
    userIdIndex: index("message_reads_user_id_idx").on(table.userId),
  }),
);

export const timelinePosts = pgTable(
  "timeline_posts",
  {
    id: text("id").primaryKey(),
    authorUserId: text("author_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: timelinePostType("type").notNull(),
    title: text("title"),
    body: text("body"),
    projectId: text("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    eventId: text("event_id").references(() => events.id, {
      onDelete: "set null",
    }),
    visibility: timelineVisibility("visibility").notNull().default("public"),
    status: timelinePostStatus("status").notNull().default("open"),
    acceptedCommentId: text("accepted_comment_id").references(() => comments.id, {
      onDelete: "set null",
    }),
    questionMeta: jsonb("question_meta").$type<TimelineQuestionMeta | null>(),
    isHidden: boolean("is_hidden").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    createdAtIndex: index("timeline_posts_created_at_idx").on(table.createdAt),
    authorIndex: index("timeline_posts_author_user_id_idx").on(table.authorUserId),
    projectIndex: index("timeline_posts_project_id_idx").on(table.projectId),
    eventIndex: index("timeline_posts_event_id_idx").on(table.eventId),
    typeStatusIndex: index("timeline_posts_type_status_idx").on(
      table.type,
      table.status,
    ),
  }),
);

export const activityEvents = pgTable(
  "activity_events",
  {
    id: text("id").primaryKey(),
    type: text("type").notNull(),
    actorUserId: text("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    projectId: text("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    eventId: text("event_id").references(() => events.id, {
      onDelete: "set null",
    }),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    payload: jsonb("payload")
      .$type<JsonPayload>()
      .notNull()
      .default(sql.raw(`'{}'::jsonb`)),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    createdAtIndex: index("activity_events_created_at_idx").on(table.createdAt),
    actorIndex: index("activity_events_actor_user_id_idx").on(table.actorUserId),
    targetIndex: index("activity_events_target_idx").on(
      table.targetType,
      table.targetId,
    ),
  }),
);

export const notifications = pgTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    payload: jsonb("payload")
      .$type<JsonPayload>()
      .notNull()
      .default(sql.raw(`'{}'::jsonb`)),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userReadAtIndex: index("notifications_user_read_at_idx").on(
      table.userId,
      table.readAt,
    ),
    createdAtIndex: index("notifications_created_at_idx").on(table.createdAt),
  }),
);

export const emailOutbox = pgTable(
  "email_outbox",
  {
    id: text("id").primaryKey(),
    toEmail: text("to_email").notNull(),
    templateId: text("template_id").notNull(),
    payload: jsonb("payload")
      .$type<JsonPayload>()
      .notNull()
      .default(sql.raw(`'{}'::jsonb`)),
    status: emailOutboxStatus("status").notNull().default("queued"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
  },
  (table) => ({
    statusCreatedAtIndex: index("email_outbox_status_created_at_idx").on(
      table.status,
      table.createdAt,
    ),
  }),
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    actorUserId: text("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    metadata: jsonb("metadata")
      .$type<JsonPayload>()
      .notNull()
      .default(sql.raw(`'{}'::jsonb`)),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    actorIndex: index("audit_logs_actor_user_id_idx").on(table.actorUserId),
    targetIndex: index("audit_logs_target_idx").on(
      table.targetType,
      table.targetId,
    ),
    createdAtIndex: index("audit_logs_created_at_idx").on(table.createdAt),
  }),
);

export type AuthUser = typeof users.$inferSelect;
export type AuthSession = typeof sessions.$inferSelect;
export type AuthAccount = typeof accounts.$inferSelect;
export type AuthVerification = typeof verifications.$inferSelect;
export type UserPreferencesRecord = typeof userPreferences.$inferSelect;
export type NotificationSettingsRecord =
  typeof notificationSettings.$inferSelect;
export type UserPresenceRecord = typeof userPresence.$inferSelect;
export type EventRecord = typeof events.$inferSelect;
export type AnnouncementRecord = typeof announcements.$inferSelect;
export type ProjectRecord = typeof projects.$inferSelect;
export type ProjectEventRecord = typeof projectEvents.$inferSelect;
export type ProjectMemberRecord = typeof projectMembers.$inferSelect;
export type TagRecord = typeof tags.$inferSelect;
export type ProjectTagRecord = typeof projectTags.$inferSelect;
export type ProjectScreenshotRecord = typeof projectScreenshots.$inferSelect;
export type UpdateRecord = typeof updates.$inferSelect;
export type CommentRecord = typeof comments.$inferSelect;
export type ReviewRecord = typeof reviews.$inferSelect;
export type ReactionRecord = typeof reactions.$inferSelect;
export type FollowRecord = typeof follows.$inferSelect;
export type SupportLinkRecord = typeof supportLinks.$inferSelect;
export type SupportRecord = typeof supportRecords.$inferSelect;
export type HelpWantedRecord = typeof helpWanted.$inferSelect;
export type JoinRequestRecord = typeof joinRequests.$inferSelect;
export type ConversationRecord = typeof conversations.$inferSelect;
export type ConversationMemberRecord = typeof conversationMembers.$inferSelect;
export type MessageRecord = typeof messages.$inferSelect;
export type MessageReadRecord = typeof messageReads.$inferSelect;
export type TimelinePostRecord = typeof timelinePosts.$inferSelect;
export type ActivityEventRecord = typeof activityEvents.$inferSelect;
export type NotificationRecord = typeof notifications.$inferSelect;
export type EmailOutboxRecord = typeof emailOutbox.$inferSelect;
export type AuditLogRecord = typeof auditLogs.$inferSelect;
