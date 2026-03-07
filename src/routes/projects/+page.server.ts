import type { PageServerLoad } from "./$types";
import { listProjects } from "$lib/server/repositories/projects";

export const load: PageServerLoad = async ({ url }) => {
  const query = url.searchParams.get("q")?.trim() ?? "";

  return {
    query,
    projects: await listProjects({
      statuses: ["published"],
      search: query || undefined,
    }),
  };
};
