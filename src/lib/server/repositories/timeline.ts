import { and, desc, eq } from "drizzle-orm";
import { getDb } from "$lib/server/db";
import { comments, timelinePosts } from "$lib/server/db/schema";
import type { CommentTargetType } from "$lib/shared/domain";

export async function getTimelinePostById(postId: string) {
  const db = getDb();
  const [post] = await db
    .select()
    .from(timelinePosts)
    .where(eq(timelinePosts.id, postId))
    .limit(1);

  return post ?? null;
}

export async function listRecentTimelinePosts(limit = 20) {
  const db = getDb();

  return db
    .select()
    .from(timelinePosts)
    .where(eq(timelinePosts.isHidden, false))
    .orderBy(desc(timelinePosts.createdAt))
    .limit(limit);
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

export async function listCommentsForTarget(
  targetType: CommentTargetType,
  targetId: string,
) {
  const db = getDb();

  return db
    .select()
    .from(comments)
    .where(and(eq(comments.targetType, targetType), eq(comments.targetId, targetId)))
    .orderBy(comments.createdAt);
}
