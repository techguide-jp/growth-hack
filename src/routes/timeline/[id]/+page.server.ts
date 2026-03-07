import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { getTimelinePostViewById } from "$lib/server/repositories/timeline";
import { TIMELINE_INVALIDATION_KEY } from "$lib/shared/timeline";

export const load: PageServerLoad = async (event) => {
  event.depends(TIMELINE_INVALIDATION_KEY);

  const post = await getTimelinePostViewById(
    event.params.id,
    event.locals.user?.id,
  );

  if (!post) {
    throw error(404, "タイムライン投稿が見つかりません。");
  }

  return {
    post,
  };
};
