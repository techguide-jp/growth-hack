import type { PageServerLoad } from "./$types";
import { listProjects } from "$lib/server/repositories/projects";

export const load: PageServerLoad = async ({ locals, url }) => {
  const query = url.searchParams.get("q")?.trim() ?? "";
  const search = query || undefined;
  const [publishedProjects, ownDraftProjects] = await Promise.all([
    listProjects({
      statuses: ["published"],
      search,
    }),
    locals.user
      ? listProjects({
          ownerUserId: locals.user.id,
          statuses: ["draft"],
          search,
        })
      : Promise.resolve([]),
  ]);

  return {
    query,
    projects: [...publishedProjects, ...ownDraftProjects],
  };
};
