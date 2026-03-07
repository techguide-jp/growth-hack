import { z } from "zod";

function emptyStringToUndefined(value: unknown) {
  return typeof value === "string" && value.trim().length === 0
    ? undefined
    : value;
}

function textFieldSchema(label: string, maxLength: number) {
  return z
    .string()
    .trim()
    .min(1, `${label}を入力してください。`)
    .max(maxLength, `${label}は${maxLength}文字以内で入力してください。`);
}

function boundedTextFieldSchema(
  label: string,
  minLength: number,
  maxLength: number,
) {
  return z
    .string()
    .trim()
    .min(minLength, `${label}は${minLength}文字以上で入力してください。`)
    .max(maxLength, `${label}は${maxLength}文字以内で入力してください。`);
}

function optionalTextFieldSchema(label: string, maxLength: number) {
  return z.preprocess(
    emptyStringToUndefined,
    textFieldSchema(label, maxLength).optional(),
  );
}

const urlFieldSchema = z.string().trim().url("URL形式で入力してください。");
const isoDatetimeStringSchema = z
  .string()
  .trim()
  .refine((value) => !Number.isNaN(Date.parse(value)), "日時形式が不正です。");

export const entityIdSchema = z
  .string()
  .trim()
  .min(1, "IDが必要です。")
  .max(191, "IDが長すぎます。");

export const optionalEntityIdSchema = z.preprocess(
  emptyStringToUndefined,
  entityIdSchema.optional(),
);
export const optionalUrlFieldSchema = z.preprocess(
  emptyStringToUndefined,
  urlFieldSchema.optional(),
);

export const PROJECT_STATUS_VALUES = [
  "draft",
  "published",
  "archived",
] as const;
export const PROJECT_STAGE_VALUES = [
  "concept",
  "prototype",
  "beta",
  "live",
] as const;
export const PROJECT_MEMBER_ROLE_VALUES = ["owner", "contributor"] as const;
export const EVENT_STATUS_VALUES = ["draft", "published"] as const;
export const ANNOUNCEMENT_TARGET_TYPE_VALUES = ["all", "event"] as const;
export const COMMENT_TARGET_TYPE_VALUES = [
  "project",
  "update",
  "timeline_post",
] as const;
export const REACTION_TARGET_TYPE_VALUES = [
  "project",
  "update",
  "timeline_post",
  "comment",
] as const;
export const REACTION_KIND_VALUES = [
  "clap",
  "like",
  "idea",
  "fire",
  "help",
] as const;
export const FOLLOW_TARGET_TYPE_VALUES = ["user", "project"] as const;
export const SUPPORT_RECORD_STATUS_VALUES = [
  "awaiting_owner",
  "confirmed",
  "cancelled",
  "rejected",
] as const;
export const HELP_WANTED_STATUS_VALUES = ["open", "closed"] as const;
export const JOIN_REQUEST_STATUS_VALUES = [
  "pending",
  "approved",
  "rejected",
] as const;
export const CONVERSATION_TYPE_VALUES = ["direct", "project"] as const;
export const TIMELINE_POST_TYPE_VALUES = [
  "progress",
  "question",
  "showcase",
] as const;
export const TIMELINE_POST_STATUS_VALUES = ["open", "solved"] as const;
export const TIMELINE_VISIBILITY_VALUES = ["public"] as const;
export const EMAIL_OUTBOX_STATUS_VALUES = ["queued", "sent", "failed"] as const;
export const PROJECT_HELP_TYPE_VALUES = [
  "feedback",
  "testing",
  "design",
  "frontend",
  "backend",
  "ai-data",
  "growth",
  "teammate",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUS_VALUES)[number];
export type ProjectStage = (typeof PROJECT_STAGE_VALUES)[number];
export type ProjectMemberRole = (typeof PROJECT_MEMBER_ROLE_VALUES)[number];
export type EventStatus = (typeof EVENT_STATUS_VALUES)[number];
export type AnnouncementTargetType =
  (typeof ANNOUNCEMENT_TARGET_TYPE_VALUES)[number];
export type CommentTargetType = (typeof COMMENT_TARGET_TYPE_VALUES)[number];
export type ReactionTargetType = (typeof REACTION_TARGET_TYPE_VALUES)[number];
export type ReactionKind = (typeof REACTION_KIND_VALUES)[number];
export type FollowTargetType = (typeof FOLLOW_TARGET_TYPE_VALUES)[number];
export type SupportRecordStatus = (typeof SUPPORT_RECORD_STATUS_VALUES)[number];
export type HelpWantedStatus = (typeof HELP_WANTED_STATUS_VALUES)[number];
export type JoinRequestStatus = (typeof JOIN_REQUEST_STATUS_VALUES)[number];
export type ConversationType = (typeof CONVERSATION_TYPE_VALUES)[number];
export type TimelinePostType = (typeof TIMELINE_POST_TYPE_VALUES)[number];
export type TimelinePostStatus = (typeof TIMELINE_POST_STATUS_VALUES)[number];
export type TimelineVisibility = (typeof TIMELINE_VISIBILITY_VALUES)[number];
export type EmailOutboxStatus = (typeof EMAIL_OUTBOX_STATUS_VALUES)[number];
export type ProjectHelpType = (typeof PROJECT_HELP_TYPE_VALUES)[number];

export const projectStatusSchema = z.enum(PROJECT_STATUS_VALUES);
export const projectStageSchema = z.enum(PROJECT_STAGE_VALUES);
export const projectMemberRoleSchema = z.enum(PROJECT_MEMBER_ROLE_VALUES);
export const eventStatusSchema = z.enum(EVENT_STATUS_VALUES);
export const announcementTargetTypeSchema = z.enum(
  ANNOUNCEMENT_TARGET_TYPE_VALUES,
);
export const commentTargetTypeSchema = z.enum(COMMENT_TARGET_TYPE_VALUES);
export const reactionTargetTypeSchema = z.enum(REACTION_TARGET_TYPE_VALUES);
export const reactionKindSchema = z.enum(REACTION_KIND_VALUES);
export const followTargetTypeSchema = z.enum(FOLLOW_TARGET_TYPE_VALUES);
export const supportRecordStatusSchema = z.enum(SUPPORT_RECORD_STATUS_VALUES);
export const helpWantedStatusSchema = z.enum(HELP_WANTED_STATUS_VALUES);
export const joinRequestStatusSchema = z.enum(JOIN_REQUEST_STATUS_VALUES);
export const conversationTypeSchema = z.enum(CONVERSATION_TYPE_VALUES);
export const timelinePostTypeSchema = z.enum(TIMELINE_POST_TYPE_VALUES);
export const timelinePostStatusSchema = z.enum(TIMELINE_POST_STATUS_VALUES);
export const timelineVisibilitySchema = z.enum(TIMELINE_VISIBILITY_VALUES);
export const emailOutboxStatusSchema = z.enum(EMAIL_OUTBOX_STATUS_VALUES);
export const projectHelpTypeSchema = z.enum(PROJECT_HELP_TYPE_VALUES);

export const projectTagSchema = textFieldSchema("タグ", 40).regex(
  /^[^\s#][^#]*$/,
  "タグに # は含められません。",
);
export const projectTagsSchema = z
  .array(projectTagSchema)
  .max(20, "タグは20件以内で入力してください。")
  .refine(
    (values) =>
      new Set(values.map((value) => value.toLowerCase())).size ===
      values.length,
    {
      message: "タグは重複して登録できません。",
    },
  );

export const projectHelpTypesSchema = z
  .array(projectHelpTypeSchema)
  .max(3, "欲しい協力は3件以内で選択してください。")
  .refine((values) => new Set(values).size === values.length, {
    message: "欲しい協力は重複して選択できません。",
  });

export const projectHighlightsSchema = z
  .array(boundedTextFieldSchema("できること・見どころ", 5, 60))
  .max(3, "できること・見どころは3件以内で入力してください。")
  .refine(
    (values) =>
      new Set(values.map((value) => value.toLowerCase())).size ===
      values.length,
    {
      message: "できること・見どころは重複して登録できません。",
    },
  );

export const createProjectInputSchema = z.object({
  title: textFieldSchema("プロジェクト名", 120),
  oneLiner: textFieldSchema("ひとことで何を作っているか", 80),
  problemStatement: z.preprocess(
    emptyStringToUndefined,
    boundedTextFieldSchema("誰のどんな課題を解決するか", 10, 200).optional(),
  ),
  projectStage: z.preprocess(
    emptyStringToUndefined,
    projectStageSchema.optional(),
  ),
  helpTypes: projectHelpTypesSchema.default([]),
  helpRequest: z.preprocess(
    emptyStringToUndefined,
    boundedTextFieldSchema("協力してほしい具体的な内容", 10, 280).optional(),
  ),
  highlights: projectHighlightsSchema.default([]),
  nextMilestone: z.preprocess(
    emptyStringToUndefined,
    boundedTextFieldSchema("次のマイルストーン", 10, 160).optional(),
  ),
  feedbackRequest: z.preprocess(
    emptyStringToUndefined,
    boundedTextFieldSchema(
      "見てほしい点 / フィードバックが欲しい点",
      10,
      160,
    ).optional(),
  ),
  backgroundNote: optionalTextFieldSchema("補足・背景", 10000),
  publicUrl: optionalUrlFieldSchema,
  repoUrl: optionalUrlFieldSchema,
  demoUrl: optionalUrlFieldSchema,
  tags: projectTagsSchema.default([]),
  status: projectStatusSchema.default("draft"),
  eventIds: z.array(entityIdSchema).max(10).default([]),
});

export const updateProjectInputSchema = createProjectInputSchema;
export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectInputSchema>;

export const timelineQuestionMetaSchema = z.object({
  situation: textFieldSchema("状況", 1000),
  problem: textFieldSchema("困りごと", 1000),
  tried: textFieldSchema("試したこと", 1000),
  environment: textFieldSchema("環境", 1000),
});

export type TimelineQuestionMeta = z.infer<typeof timelineQuestionMetaSchema>;

export const createTimelinePostInputSchema = z
  .object({
    type: timelinePostTypeSchema,
    title: optionalTextFieldSchema("タイトル", 120),
    body: optionalTextFieldSchema("本文", 10000),
    projectId: optionalEntityIdSchema,
    eventId: optionalEntityIdSchema,
    questionMeta: timelineQuestionMetaSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.body) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "本文を入力してください。",
        path: ["body"],
      });
    }

    if (value.type === "question") {
      if (!value.title) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "相談タイトルを入力してください。",
          path: ["title"],
        });
      }

      if (!value.questionMeta) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "相談テンプレを入力してください。",
          path: ["questionMeta"],
        });
      }
    } else if (value.questionMeta) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "相談投稿以外では質問テンプレを送信できません。",
        path: ["questionMeta"],
      });
    }
  });
export type CreateTimelinePostInput = z.infer<
  typeof createTimelinePostInputSchema
>;

export const createCommentInputSchema = z.object({
  targetType: commentTargetTypeSchema,
  targetId: entityIdSchema,
  body: textFieldSchema("コメント", 5000),
});
export type CreateCommentInput = z.infer<typeof createCommentInputSchema>;

export const createReviewInputSchema = z.object({
  projectId: entityIdSchema,
  rating: z
    .number()
    .int("評価は整数で入力してください。")
    .min(1, "評価は1以上で入力してください。")
    .max(5, "評価は5以下で入力してください。"),
  body: textFieldSchema("レビュー本文", 5000),
});
export type CreateReviewInput = z.infer<typeof createReviewInputSchema>;

export const toggleReactionInputSchema = z.object({
  targetType: reactionTargetTypeSchema,
  targetId: entityIdSchema,
  kind: reactionKindSchema,
});

export const toggleFollowInputSchema = z.object({
  targetType: followTargetTypeSchema,
  targetId: entityIdSchema,
});

export const createSupportLinkInputSchema = z.object({
  projectId: entityIdSchema,
  kind: textFieldSchema("支援リンク種別", 40),
  url: urlFieldSchema,
});
export type CreateSupportLinkInput = z.infer<
  typeof createSupportLinkInputSchema
>;

export const createSupportRecordInputSchema = z.object({
  projectId: entityIdSchema,
  amountJpy: z
    .number()
    .int("支援金額は整数で入力してください。")
    .positive("支援金額は1円以上で入力してください。")
    .max(100_000_000, "支援金額が大きすぎます。"),
  message: optionalTextFieldSchema("支援メッセージ", 1000),
  externalReference: optionalTextFieldSchema("外部参照ID", 191),
});
export type CreateSupportRecordInput = z.infer<
  typeof createSupportRecordInputSchema
>;

export const createHelpWantedInputSchema = z.object({
  projectId: entityIdSchema,
  title: textFieldSchema("募集タイトル", 120),
  detail: textFieldSchema("募集内容", 5000),
  skills: z.array(textFieldSchema("募集スキル", 64)).max(20).default([]),
  status: helpWantedStatusSchema.default("open"),
});
export type CreateHelpWantedInput = z.infer<typeof createHelpWantedInputSchema>;

export const createJoinRequestInputSchema = z.object({
  projectId: entityIdSchema,
  message: textFieldSchema("参加申請メッセージ", 2000),
});
export type CreateJoinRequestInput = z.infer<
  typeof createJoinRequestInputSchema
>;

export const createConversationInputSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("direct"),
    userId: entityIdSchema,
  }),
  z.object({
    type: z.literal("project"),
    projectId: entityIdSchema,
  }),
]);
export type CreateConversationInput = z.infer<
  typeof createConversationInputSchema
>;

export const sendMessageInputSchema = z.object({
  body: textFieldSchema("メッセージ", 5000),
});
export type SendMessageInput = z.infer<typeof sendMessageInputSchema>;

export const createEventInputSchema = z
  .object({
    title: textFieldSchema("イベント名", 120),
    description: textFieldSchema("イベント説明", 5000),
    startAt: isoDatetimeStringSchema,
    endAt: isoDatetimeStringSchema,
    status: eventStatusSchema.default("draft"),
  })
  .refine(
    (value) =>
      new Date(value.endAt).getTime() >= new Date(value.startAt).getTime(),
    {
      message: "終了日時は開始日時以降にしてください。",
      path: ["endAt"],
    },
  );
export type CreateEventInput = z.infer<typeof createEventInputSchema>;

export const createAnnouncementInputSchema = z
  .object({
    title: textFieldSchema("告知タイトル", 120),
    body: textFieldSchema("告知本文", 5000),
    targetType: announcementTargetTypeSchema,
    eventId: optionalEntityIdSchema,
  })
  .superRefine((value, ctx) => {
    if (value.targetType === "event" && !value.eventId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "イベント向け告知では eventId が必要です。",
        path: ["eventId"],
      });
    }
  });
export type CreateAnnouncementInput = z.infer<
  typeof createAnnouncementInputSchema
>;
