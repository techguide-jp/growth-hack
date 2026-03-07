import { json, type RequestHandler } from "@sveltejs/kit";
import { z } from "zod";
import {
  createComment,
  listCommentsForTarget,
  TimelineRepositoryError,
} from "$lib/server/repositories/timeline";
import {
  commentTargetTypeSchema,
  createCommentInputSchema,
  entityIdSchema,
} from "$lib/shared/domain";

const listCommentsQuerySchema = z.object({
  targetId: entityIdSchema,
  targetType: commentTargetTypeSchema,
});

function jsonTimelineError(error: unknown) {
  if (error instanceof TimelineRepositoryError) {
    return json({ message: error.message }, { status: error.status });
  }

  console.error(error);
  return json({ message: "Internal Server Error" }, { status: 500 });
}

export const GET: RequestHandler = async ({ locals, url }) => {
  const parsed = listCommentsQuerySchema.safeParse({
    targetId: url.searchParams.get("targetId"),
    targetType: url.searchParams.get("targetType"),
  });

  if (!parsed.success) {
    return json(
      { message: parsed.error.issues[0]?.message ?? "Invalid query" },
      { status: 400 },
    );
  }

  try {
    const comments = await listCommentsForTarget(
      parsed.data.targetType,
      parsed.data.targetId,
      locals.user?.id,
    );

    return json({
      comments,
    });
  } catch (error) {
    return jsonTimelineError(error);
  }
};

export const POST: RequestHandler = async ({ locals, request }) => {
  if (!locals.user) {
    return json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createCommentInputSchema.safeParse(body);

  if (!parsed.success) {
    return json(
      { message: parsed.error.issues[0]?.message ?? "Invalid payload" },
      { status: 400 },
    );
  }

  try {
    const comment = await createComment(locals.user.id, parsed.data);

    return json(
      {
        comment,
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonTimelineError(error);
  }
};
