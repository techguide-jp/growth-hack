import { json, type RequestHandler } from "@sveltejs/kit";
import {
  solveTimelinePost,
  TimelineRepositoryError,
} from "$lib/server/repositories/timeline";
import { solveTimelinePostInputSchema } from "$lib/shared/timeline";

function jsonTimelineError(error: unknown) {
  if (error instanceof TimelineRepositoryError) {
    return json({ message: error.message }, { status: error.status });
  }

  console.error(error);
  return json({ message: "Internal Server Error" }, { status: 500 });
}

export const POST: RequestHandler = async ({ locals, params, request }) => {
  if (!locals.user) {
    return json({ message: "Unauthorized" }, { status: 401 });
  }

  const postId = params.postId;

  if (!postId) {
    return json({ message: "postId is required" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = solveTimelinePostInputSchema.safeParse(body);

  if (!parsed.success) {
    return json(
      { message: parsed.error.issues[0]?.message ?? "Invalid payload" },
      { status: 400 },
    );
  }

  try {
    const post = await solveTimelinePost(
      postId,
      locals.user.id,
      parsed.data.acceptedCommentId,
    );

    return json({
      post,
    });
  } catch (error) {
    return jsonTimelineError(error);
  }
};
