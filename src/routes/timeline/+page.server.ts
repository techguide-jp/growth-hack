import type { PageServerLoad } from "./$types";
import { listProjects } from "$lib/server/repositories/projects";
import { listTimelinePosts } from "$lib/server/repositories/timeline";
import {
  parseTimelineScope,
  TIMELINE_INVALIDATION_KEY,
} from "$lib/shared/timeline";

export const load: PageServerLoad = async (event) => {
  event.depends(TIMELINE_INVALIDATION_KEY);

  const scope = parseTimelineScope(event.url.searchParams.get("scope"));
  const [posts, myProjects] = await Promise.all([
    scope === "following" && !event.locals.user
      ? Promise.resolve([])
      : listTimelinePosts({
          scope,
          viewerUserId: event.locals.user?.id,
          limit: 20,
        }),
    event.locals.user
      ? listProjects({
          ownerUserId: event.locals.user.id,
          statuses: ["published"],
        })
      : Promise.resolve([]),
  ]);

  return {
    scope,
    posts,
    myProjects,
    canViewFollowing: Boolean(event.locals.user),
    isLoggedIn: Boolean(event.locals.user),
  };
};
