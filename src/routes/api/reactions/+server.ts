import { json, type RequestHandler } from "@sveltejs/kit";
import {
  addReaction,
  removeReaction,
  TimelineRepositoryError,
} from "$lib/server/repositories/timeline";
import { toggleReactionInputSchema } from "$lib/shared/domain";

function jsonTimelineError(error: unknown) {
  if (error instanceof TimelineRepositoryError) {
    return json({ message: error.message }, { status: error.status });
  }

  console.error(error);
  return json({ message: "Internal Server Error" }, { status: 500 });
}

async function parseReactionRequestBody(request: Request) {
  const body = await request.json().catch(() => null);
  return toggleReactionInputSchema.safeParse(body);
}

export const POST: RequestHandler = async ({ locals, request }) => {
  if (!locals.user) {
    return json({ message: "Unauthorized" }, { status: 401 });
  }

  const parsed = await parseReactionRequestBody(request);

  if (!parsed.success) {
    return json(
      { message: parsed.error.issues[0]?.message ?? "Invalid payload" },
      { status: 400 },
    );
  }

  try {
    const reactions = await addReaction(
      locals.user.id,
      parsed.data.targetType,
      parsed.data.targetId,
      parsed.data.kind,
    );

    return json({
      reactions,
    });
  } catch (error) {
    return jsonTimelineError(error);
  }
};

export const DELETE: RequestHandler = async ({ locals, request }) => {
  if (!locals.user) {
    return json({ message: "Unauthorized" }, { status: 401 });
  }

  const parsed = await parseReactionRequestBody(request);

  if (!parsed.success) {
    return json(
      { message: parsed.error.issues[0]?.message ?? "Invalid payload" },
      { status: 400 },
    );
  }

  try {
    const reactions = await removeReaction(
      locals.user.id,
      parsed.data.targetType,
      parsed.data.targetId,
      parsed.data.kind,
    );

    return json({
      reactions,
    });
  } catch (error) {
    return jsonTimelineError(error);
  }
};
