import { json, type RequestHandler } from "@sveltejs/kit";
import {
  createTimelinePost,
  listTimelinePosts,
  TimelineRepositoryError,
} from "$lib/server/repositories/timeline";
import { createTimelinePostInputSchema } from "$lib/shared/domain";
import { parseTimelineScope } from "$lib/shared/timeline";

function jsonTimelineError(error: unknown) {
  if (error instanceof TimelineRepositoryError) {
    return json({ message: error.message }, { status: error.status });
  }

  console.error(error);
  return json({ message: "Internal Server Error" }, { status: 500 });
}

function parseLimit(value: string | null) {
  if (!value) {
    return 20;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 100) {
    return null;
  }

  return parsed;
}

export const GET: RequestHandler = async ({ locals, url }) => {
  const scope = parseTimelineScope(url.searchParams.get("scope"));
  const limit = parseLimit(url.searchParams.get("limit"));

  if (limit === null) {
    return json(
      { message: "limit は 1 以上 100 以下の整数で指定してください。" },
      { status: 400 },
    );
  }

  if (scope === "following" && !locals.user) {
    return json(
      { message: "フォロー中フィードの取得にはログインが必要です。" },
      { status: 401 },
    );
  }

  try {
    const posts = await listTimelinePosts({
      scope,
      viewerUserId: locals.user?.id,
      limit,
    });

    return json({
      posts,
      scope,
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
  const parsed = createTimelinePostInputSchema.safeParse(body);

  if (!parsed.success) {
    return json(
      { message: parsed.error.issues[0]?.message ?? "Invalid payload" },
      { status: 400 },
    );
  }

  try {
    const post = await createTimelinePost(locals.user.id, parsed.data);

    return json(
      {
        post,
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonTimelineError(error);
  }
};
