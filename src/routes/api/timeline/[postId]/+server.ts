import { json, type RequestHandler } from "@sveltejs/kit";
import { getTimelinePostViewById } from "$lib/server/repositories/timeline";

export const GET: RequestHandler = async ({ locals, params }) => {
  const postId = params.postId;

  if (!postId) {
    return json({ message: "postId is required" }, { status: 400 });
  }

  const post = await getTimelinePostViewById(postId, locals.user?.id);

  if (!post) {
    return json(
      { message: "タイムライン投稿が見つかりません。" },
      { status: 404 },
    );
  }

  return json({
    post,
  });
};
