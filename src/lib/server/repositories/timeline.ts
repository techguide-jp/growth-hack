import { and, desc, eq, inArray, or } from "drizzle-orm";
import { getDb } from "$lib/server/db";
import {
  comments,
  follows,
  projects,
  reactions,
  timelinePosts,
  updates,
  users,
} from "$lib/server/db/schema";
import type {
  CommentTargetType,
  CreateCommentInput,
  CreateTimelinePostInput,
  ReactionKind,
  ReactionTargetType,
  TimelinePostStatus,
  TimelinePostType,
} from "$lib/shared/domain";
import {
  createEmptyTimelineReactionSummary,
  TIMELINE_COMMENT_PREVIEW_LIMIT,
  type TimelineCommentView,
  type TimelinePostView,
  type TimelineReactionSummary,
  type TimelineScope,
} from "$lib/shared/timeline";
import {
  getProjectById,
  isProjectMember,
} from "$lib/server/repositories/projects";

type ProjectRecord = typeof projects.$inferSelect;
type TimelinePostRecord = typeof timelinePosts.$inferSelect;
type CommentRecord = typeof comments.$inferSelect;

type TimelineListOptions = {
  scope?: TimelineScope;
  viewerUserId?: string | null;
  limit?: number;
  authorUserId?: string;
  types?: TimelinePostType[];
  statuses?: TimelinePostStatus[];
  includeFullComments?: boolean;
};

type ReactionRecordLike = {
  kind: ReactionKind;
  userId: string;
};

type FollowingTargets = {
  projectIds: string[];
  userIds: string[];
};

type TimelineSolveValidationInput = {
  acceptedComment: Pick<CommentRecord, "id" | "targetId" | "targetType"> | null;
  post: Pick<TimelinePostRecord, "authorUserId" | "id" | "type">;
  viewerUserId: string;
};

type ProjectVisibilityRecord = Pick<ProjectRecord, "ownerUserId" | "status">;

type TimelineProjectRecord = Pick<
  ProjectRecord,
  "id" | "ownerUserId" | "status" | "title"
>;

export class TimelineRepositoryError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "TimelineRepositoryError";
    this.status = status;
  }
}

function getWhereClause(
  conditions: Array<
    ReturnType<typeof eq> | ReturnType<typeof inArray> | ReturnType<typeof or>
  >,
) {
  if (conditions.length === 0) {
    return undefined;
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  return and(...conditions);
}

function createTimelineAuthorFallback(userId: string) {
  return {
    id: userId,
    displayName: "Unknown",
    avatarUrl: null,
  };
}

export function canViewerAccessProject(
  project: ProjectVisibilityRecord | null,
  viewerUserId?: string | null,
) {
  if (!project) {
    return false;
  }

  return project.status !== "draft" || project.ownerUserId === viewerUserId;
}

export function canLinkProjectToTimelinePost(
  project: Pick<ProjectRecord, "status"> | null,
) {
  return project?.status === "published";
}

export function buildReactionSummary(
  reactionRows: ReactionRecordLike[],
  viewerUserId?: string | null,
) {
  const summary = createEmptyTimelineReactionSummary();
  const summaryMap = new Map(summary.map((item) => [item.kind, item]));

  for (const row of reactionRows) {
    const current = summaryMap.get(row.kind);

    if (!current) {
      continue;
    }

    current.count += 1;

    if (viewerUserId && row.userId === viewerUserId) {
      current.reactedByMe = true;
    }
  }

  return summary;
}

export function selectTimelineCommentPreview(
  commentViews: TimelineCommentView[],
  limit = TIMELINE_COMMENT_PREVIEW_LIMIT,
) {
  if (commentViews.length <= limit) {
    return [...commentViews];
  }

  return commentViews.slice(commentViews.length - limit);
}

export function isTimelinePostIncludedInFollowingFeed(
  post: Pick<TimelinePostRecord, "authorUserId" | "projectId">,
  followedUserIds: string[],
  followedProjectIds: string[],
) {
  if (followedUserIds.includes(post.authorUserId)) {
    return true;
  }

  return Boolean(post.projectId && followedProjectIds.includes(post.projectId));
}

export function validateTimelineSolveRequest(
  input: TimelineSolveValidationInput,
) {
  if (input.post.type !== "question") {
    return {
      ok: false as const,
      message: "相談投稿のみ解決済みにできます。",
      status: 400,
    };
  }

  if (input.post.authorUserId !== input.viewerUserId) {
    return {
      ok: false as const,
      message: "投稿者本人のみ解決済みにできます。",
      status: 403,
    };
  }

  if (
    !input.acceptedComment ||
    input.acceptedComment.targetType !== "timeline_post" ||
    input.acceptedComment.targetId !== input.post.id
  ) {
    return {
      ok: false as const,
      message: "指定したコメントはこの相談投稿に紐づいていません。",
      status: 400,
    };
  }

  return {
    ok: true as const,
  };
}

function assertTimelineResult(
  result:
    | { ok: true }
    | {
        ok: false;
        message: string;
        status: number;
      },
) {
  if (!result.ok) {
    throw new TimelineRepositoryError(result.status, result.message);
  }
}

async function listFollowingTargets(userId: string): Promise<FollowingTargets> {
  const db = getDb();
  const followRows = await db
    .select({
      targetId: follows.targetId,
      targetType: follows.targetType,
    })
    .from(follows)
    .where(eq(follows.followerUserId, userId));

  const projectIds: string[] = [];
  const userIds: string[] = [];

  for (const followRow of followRows) {
    if (followRow.targetType === "project") {
      projectIds.push(followRow.targetId);
      continue;
    }

    if (followRow.targetType === "user") {
      userIds.push(followRow.targetId);
    }
  }

  return {
    projectIds,
    userIds,
  };
}

function getFollowingFeedCondition(targets: FollowingTargets) {
  const conditions = [];

  if (targets.userIds.length > 0) {
    conditions.push(inArray(timelinePosts.authorUserId, targets.userIds));
  }

  if (targets.projectIds.length > 0) {
    conditions.push(inArray(timelinePosts.projectId, targets.projectIds));
  }

  if (conditions.length === 0) {
    return null;
  }

  return conditions.length === 1 ? conditions[0] : or(...conditions);
}

function toCommentView(
  row: {
    authorAvatarUrl: string | null;
    authorDisplayName: string;
    authorId: string;
    body: string;
    createdAt: Date;
    id: string;
    targetId: string;
    targetType: CommentTargetType;
  },
  acceptedCommentId: string | null,
): TimelineCommentView {
  return {
    id: row.id,
    targetId: row.targetId,
    targetType: row.targetType,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    author: {
      id: row.authorId,
      displayName: row.authorDisplayName,
      avatarUrl: row.authorAvatarUrl,
    },
    isAccepted: row.id === acceptedCommentId,
  };
}

function toTimelineProjectSummary(
  project: TimelineProjectRecord | null,
  viewerUserId?: string | null,
) {
  if (!project || !canViewerAccessProject(project, viewerUserId)) {
    return null;
  }

  return {
    id: project.id,
    title: project.title,
  };
}

async function buildTimelinePostViews(
  postRows: TimelinePostRecord[],
  options: {
    includeFullComments: boolean;
    viewerUserId?: string | null;
  },
) {
  if (postRows.length === 0) {
    return [];
  }

  const db = getDb();
  const postIds = postRows.map((post) => post.id);
  const authorUserIds = [...new Set(postRows.map((post) => post.authorUserId))];
  const projectIds = [
    ...new Set(
      postRows.flatMap((post) => (post.projectId ? [post.projectId] : [])),
    ),
  ];

  const [authorRows, projectRows, commentRows, reactionRows] =
    await Promise.all([
      db
        .select({
          avatarUrl: users.avatarUrl,
          displayName: users.displayName,
          id: users.id,
        })
        .from(users)
        .where(inArray(users.id, authorUserIds)),
      projectIds.length > 0
        ? db
            .select({
              id: projects.id,
              ownerUserId: projects.ownerUserId,
              status: projects.status,
              title: projects.title,
            })
            .from(projects)
            .where(inArray(projects.id, projectIds))
        : Promise.resolve([]),
      db
        .select({
          authorAvatarUrl: users.avatarUrl,
          authorDisplayName: users.displayName,
          authorId: users.id,
          body: comments.body,
          createdAt: comments.createdAt,
          id: comments.id,
          targetId: comments.targetId,
          targetType: comments.targetType,
        })
        .from(comments)
        .innerJoin(users, eq(comments.authorUserId, users.id))
        .where(
          and(
            eq(comments.targetType, "timeline_post"),
            inArray(comments.targetId, postIds),
          ),
        )
        .orderBy(comments.createdAt),
      db
        .select({
          kind: reactions.kind,
          targetId: reactions.targetId,
          userId: reactions.userId,
        })
        .from(reactions)
        .where(
          and(
            eq(reactions.targetType, "timeline_post"),
            inArray(reactions.targetId, postIds),
          ),
        ),
    ]);

  const authorMap = new Map(authorRows.map((author) => [author.id, author]));
  const projectMap = new Map(
    projectRows.map((project) => [project.id, project]),
  );
  const commentsByPostId = new Map<string, TimelineCommentView[]>();
  const reactionsByPostId = new Map<string, ReactionRecordLike[]>();

  const acceptedCommentIdByPostId = new Map(
    postRows.map((post) => [post.id, post.acceptedCommentId ?? null]),
  );

  for (const commentRow of commentRows) {
    const current = commentsByPostId.get(commentRow.targetId) ?? [];
    current.push(
      toCommentView(
        commentRow,
        acceptedCommentIdByPostId.get(commentRow.targetId) ?? null,
      ),
    );
    commentsByPostId.set(commentRow.targetId, current);
  }

  for (const reactionRow of reactionRows) {
    const current = reactionsByPostId.get(reactionRow.targetId) ?? [];
    current.push({
      kind: reactionRow.kind,
      userId: reactionRow.userId,
    });
    reactionsByPostId.set(reactionRow.targetId, current);
  }

  return postRows.map<TimelinePostView>((post) => {
    const commentViews = commentsByPostId.get(post.id) ?? [];
    const author =
      authorMap.get(post.authorUserId) ??
      createTimelineAuthorFallback(post.authorUserId);
    const project = post.projectId
      ? (projectMap.get(post.projectId) ?? null)
      : null;

    return {
      id: post.id,
      type: post.type,
      title: post.title ?? null,
      body: post.body ?? "",
      status: post.status,
      questionMeta: post.questionMeta ?? null,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      acceptedCommentId: post.acceptedCommentId ?? null,
      author: {
        id: author.id,
        displayName: author.displayName,
        avatarUrl: author.avatarUrl,
      },
      project: toTimelineProjectSummary(project, options.viewerUserId),
      commentCount: commentViews.length,
      commentsPreview: selectTimelineCommentPreview(commentViews),
      comments: options.includeFullComments ? commentViews : [],
      reactions: buildReactionSummary(
        reactionsByPostId.get(post.id) ?? [],
        options.viewerUserId,
      ),
      viewerCanSolve:
        Boolean(options.viewerUserId) &&
        post.type === "question" &&
        post.status === "open" &&
        post.authorUserId === options.viewerUserId,
    };
  });
}

async function getUpdateById(updateId: string) {
  const db = getDb();
  const [update] = await db
    .select()
    .from(updates)
    .where(eq(updates.id, updateId))
    .limit(1);

  return update ?? null;
}

async function getAccessibleProjectById(
  projectId: string,
  viewerUserId?: string | null,
) {
  const project = await getProjectById(projectId);

  if (!canViewerAccessProject(project, viewerUserId)) {
    return null;
  }

  return project;
}

export async function getTimelinePostById(postId: string) {
  const db = getDb();
  const [post] = await db
    .select()
    .from(timelinePosts)
    .where(eq(timelinePosts.id, postId))
    .limit(1);

  return post ?? null;
}

export async function getCommentById(commentId: string) {
  const db = getDb();
  const [comment] = await db
    .select()
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);

  return comment ?? null;
}

async function assertCommentTargetExists(
  targetType: CommentTargetType,
  targetId: string,
  viewerUserId?: string | null,
) {
  switch (targetType) {
    case "project": {
      const project = await getAccessibleProjectById(targetId, viewerUserId);

      if (!project) {
        throw new TimelineRepositoryError(
          404,
          "コメント対象のプロジェクトが見つかりません。",
        );
      }

      return;
    }
    case "update": {
      const update = await getUpdateById(targetId);

      if (
        !update ||
        !(await getAccessibleProjectById(update.projectId, viewerUserId))
      ) {
        throw new TimelineRepositoryError(
          404,
          "コメント対象の更新投稿が見つかりません。",
        );
      }

      return;
    }
    case "timeline_post": {
      const post = await getTimelinePostById(targetId);

      if (!post || post.isHidden) {
        throw new TimelineRepositoryError(
          404,
          "コメント対象のタイムライン投稿が見つかりません。",
        );
      }

      return;
    }
  }
}

async function assertReactionTargetExists(
  targetType: ReactionTargetType,
  targetId: string,
  viewerUserId?: string | null,
) {
  switch (targetType) {
    case "comment": {
      const comment = await getCommentById(targetId);

      if (!comment) {
        throw new TimelineRepositoryError(
          404,
          "リアクション対象のコメントが見つかりません。",
        );
      }

      await assertCommentTargetExists(
        comment.targetType,
        comment.targetId,
        viewerUserId,
      );
      return;
    }
    case "project":
    case "update":
    case "timeline_post":
      return assertCommentTargetExists(targetType, targetId, viewerUserId);
  }
}

export async function listTimelinePosts(options: TimelineListOptions = {}) {
  const db = getDb();
  const scope = options.scope ?? "global";
  const conditions = [eq(timelinePosts.isHidden, false)];
  let followingTargets: FollowingTargets | null = null;

  if (options.authorUserId) {
    conditions.push(eq(timelinePosts.authorUserId, options.authorUserId));
  }

  if (options.types && options.types.length > 0) {
    conditions.push(inArray(timelinePosts.type, options.types));
  }

  if (options.statuses && options.statuses.length > 0) {
    conditions.push(inArray(timelinePosts.status, options.statuses));
  }

  if (scope === "following") {
    if (!options.viewerUserId) {
      return [];
    }

    followingTargets = await listFollowingTargets(options.viewerUserId);
    const followingCondition = getFollowingFeedCondition(followingTargets);

    if (!followingCondition) {
      return [];
    }

    conditions.push(followingCondition);
  }

  const whereClause = getWhereClause(conditions);
  const postRows = whereClause
    ? await db
        .select()
        .from(timelinePosts)
        .where(whereClause)
        .orderBy(desc(timelinePosts.createdAt))
        .limit(options.limit ?? 20)
    : await db
        .select()
        .from(timelinePosts)
        .orderBy(desc(timelinePosts.createdAt))
        .limit(options.limit ?? 20);

  const filteredRows =
    scope === "following" && followingTargets
      ? postRows.filter((post) =>
          isTimelinePostIncludedInFollowingFeed(
            post,
            followingTargets.userIds,
            followingTargets.projectIds,
          ),
        )
      : postRows;

  return buildTimelinePostViews(filteredRows, {
    includeFullComments: options.includeFullComments ?? false,
    viewerUserId: options.viewerUserId,
  });
}

export async function getTimelinePostViewById(
  postId: string,
  viewerUserId?: string | null,
) {
  const post = await getTimelinePostById(postId);

  if (!post || post.isHidden) {
    return null;
  }

  const [view] = await buildTimelinePostViews([post], {
    includeFullComments: true,
    viewerUserId,
  });

  return view ?? null;
}

export async function listCommentsForTarget(
  targetType: CommentTargetType,
  targetId: string,
  viewerUserId?: string | null,
) {
  const db = getDb();
  let acceptedCommentId: string | null = null;

  if (targetType === "timeline_post") {
    const post = await getTimelinePostById(targetId);

    if (!post || post.isHidden) {
      throw new TimelineRepositoryError(
        404,
        "コメント対象のタイムライン投稿が見つかりません。",
      );
    }

    acceptedCommentId = post.acceptedCommentId ?? null;
  } else {
    await assertCommentTargetExists(targetType, targetId, viewerUserId);
  }

  const rows = await db
    .select({
      authorAvatarUrl: users.avatarUrl,
      authorDisplayName: users.displayName,
      authorId: users.id,
      body: comments.body,
      createdAt: comments.createdAt,
      id: comments.id,
      targetId: comments.targetId,
      targetType: comments.targetType,
    })
    .from(comments)
    .innerJoin(users, eq(comments.authorUserId, users.id))
    .where(
      and(eq(comments.targetType, targetType), eq(comments.targetId, targetId)),
    )
    .orderBy(comments.createdAt);

  return rows.map((row) => toCommentView(row, acceptedCommentId));
}

export async function listReactionSummaryForTarget(
  targetType: ReactionTargetType,
  targetId: string,
  viewerUserId?: string | null,
) {
  await assertReactionTargetExists(targetType, targetId, viewerUserId);
  const db = getDb();
  const rows = await db
    .select({
      kind: reactions.kind,
      userId: reactions.userId,
    })
    .from(reactions)
    .where(
      and(
        eq(reactions.targetType, targetType),
        eq(reactions.targetId, targetId),
      ),
    );

  return buildReactionSummary(rows, viewerUserId);
}

export async function createTimelinePost(
  authorUserId: string,
  input: CreateTimelinePostInput,
) {
  const db = getDb();
  const postId = crypto.randomUUID();
  const now = new Date();

  if (input.projectId) {
    const project = await getProjectById(input.projectId);

    if (!project) {
      throw new TimelineRepositoryError(
        404,
        "関連付けるプロジェクトが見つかりません。",
      );
    }

    if (!canLinkProjectToTimelinePost(project)) {
      throw new TimelineRepositoryError(
        400,
        "公開中のプロジェクトのみ関連付けできます。",
      );
    }

    if (!(await isProjectMember(input.projectId, authorUserId))) {
      throw new TimelineRepositoryError(
        403,
        "関連付けるには対象プロジェクトのメンバーである必要があります。",
      );
    }
  }

  await db.insert(timelinePosts).values({
    id: postId,
    authorUserId,
    type: input.type,
    title: input.title ?? null,
    body: input.body ?? null,
    projectId: input.projectId ?? null,
    eventId: input.eventId ?? null,
    questionMeta: input.questionMeta ?? null,
    status: input.type === "question" ? "open" : "open",
    createdAt: now,
    updatedAt: now,
  });

  const post = await getTimelinePostViewById(postId, authorUserId);

  if (!post) {
    throw new TimelineRepositoryError(
      500,
      "タイムライン投稿の作成後に読み込みできませんでした。",
    );
  }

  return post;
}

export async function createComment(
  authorUserId: string,
  input: CreateCommentInput,
) {
  const db = getDb();
  const commentId = crypto.randomUUID();
  const now = new Date();

  await assertCommentTargetExists(
    input.targetType,
    input.targetId,
    authorUserId,
  );

  await db.insert(comments).values({
    id: commentId,
    targetType: input.targetType,
    targetId: input.targetId,
    authorUserId,
    body: input.body,
    createdAt: now,
    updatedAt: now,
  });

  const [comment] = await listCommentsForTarget(
    input.targetType,
    input.targetId,
    authorUserId,
  ).then((rows) => rows.filter((row) => row.id === commentId));

  if (!comment) {
    throw new TimelineRepositoryError(
      500,
      "コメント作成後に再取得できませんでした。",
    );
  }

  return comment;
}

export async function addReaction(
  userId: string,
  targetType: ReactionTargetType,
  targetId: string,
  kind: ReactionKind,
) {
  const db = getDb();

  await assertReactionTargetExists(targetType, targetId, userId);

  await db
    .insert(reactions)
    .values({
      id: crypto.randomUUID(),
      targetType,
      targetId,
      userId,
      kind,
    })
    .onConflictDoNothing();

  return listReactionSummaryForTarget(targetType, targetId, userId);
}

export async function removeReaction(
  userId: string,
  targetType: ReactionTargetType,
  targetId: string,
  kind: ReactionKind,
) {
  const db = getDb();

  await assertReactionTargetExists(targetType, targetId, userId);

  await db
    .delete(reactions)
    .where(
      and(
        eq(reactions.targetType, targetType),
        eq(reactions.targetId, targetId),
        eq(reactions.userId, userId),
        eq(reactions.kind, kind),
      ),
    );

  return listReactionSummaryForTarget(targetType, targetId, userId);
}

export async function solveTimelinePost(
  postId: string,
  viewerUserId: string,
  acceptedCommentId: string,
) {
  const db = getDb();
  const [post, acceptedComment] = await Promise.all([
    getTimelinePostById(postId),
    getCommentById(acceptedCommentId),
  ]);

  if (!post || post.isHidden) {
    throw new TimelineRepositoryError(
      404,
      "対象のタイムライン投稿が見つかりません。",
    );
  }

  assertTimelineResult(
    validateTimelineSolveRequest({
      acceptedComment,
      post,
      viewerUserId,
    }),
  );

  await db
    .update(timelinePosts)
    .set({
      acceptedCommentId,
      status: "solved",
      updatedAt: new Date(),
    })
    .where(eq(timelinePosts.id, postId));

  const nextPost = await getTimelinePostViewById(postId, viewerUserId);

  if (!nextPost) {
    throw new TimelineRepositoryError(
      500,
      "解決済み更新後のタイムライン投稿を取得できませんでした。",
    );
  }

  return nextPost;
}
