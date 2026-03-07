import { z } from "zod";
import {
  entityIdSchema,
  REACTION_KIND_VALUES,
  type CommentTargetType,
  type ReactionKind,
  type TimelinePostStatus,
  type TimelinePostType,
  type TimelineQuestionMeta,
} from "$lib/shared/domain";

export const TIMELINE_SCOPE_VALUES = ["global", "following"] as const;
export const timelineScopeSchema = z.enum(TIMELINE_SCOPE_VALUES);
export type TimelineScope = (typeof TIMELINE_SCOPE_VALUES)[number];

export const solveTimelinePostInputSchema = z.object({
  acceptedCommentId: entityIdSchema,
});
export type SolveTimelinePostInput = z.infer<
  typeof solveTimelinePostInputSchema
>;

export const TIMELINE_INVALIDATION_KEY = "app:timeline";
export const TIMELINE_COMMENT_PREVIEW_LIMIT = 3;

export type TimelineAuthorView = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
};

export type TimelineProjectSummary = {
  id: string;
  title: string;
};

export type TimelineReactionSummary = {
  kind: ReactionKind;
  count: number;
  reactedByMe: boolean;
};

export type TimelineCommentView = {
  id: string;
  targetId: string;
  targetType: CommentTargetType;
  body: string;
  createdAt: string;
  author: TimelineAuthorView;
  isAccepted: boolean;
};

export type TimelinePostView = {
  id: string;
  type: TimelinePostType;
  title: string | null;
  body: string;
  status: TimelinePostStatus;
  questionMeta: TimelineQuestionMeta | null;
  createdAt: string;
  updatedAt: string;
  acceptedCommentId: string | null;
  author: TimelineAuthorView;
  project: TimelineProjectSummary | null;
  commentCount: number;
  commentsPreview: TimelineCommentView[];
  comments: TimelineCommentView[];
  reactions: TimelineReactionSummary[];
  viewerCanSolve: boolean;
};

export function parseTimelineScope(
  value: string | null | undefined,
): TimelineScope {
  const parsed = timelineScopeSchema.safeParse(value);
  return parsed.success ? parsed.data : "global";
}

export function createEmptyTimelineReactionSummary() {
  return REACTION_KIND_VALUES.map((kind) => ({
    kind,
    count: 0,
    reactedByMe: false as boolean,
  })) satisfies TimelineReactionSummary[];
}
