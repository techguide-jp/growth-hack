import type { PageServerLoad } from "./$types";
import { listProjects } from "$lib/server/repositories/projects";
import { listTimelinePosts } from "$lib/server/repositories/timeline";
import { TIMELINE_INVALIDATION_KEY } from "$lib/shared/timeline";

export const load: PageServerLoad = async (event) => {
  event.depends(TIMELINE_INVALIDATION_KEY);

  const [recentPosts, recentProjects] = await Promise.all([
    listTimelinePosts({
      viewerUserId: event.locals.user?.id,
      limit: 5,
    }),
    listProjects({
      statuses: ["published"],
      limit: 3,
    }),
  ]);

  return {
    recentPosts,
    recentProjects,
  };
};
