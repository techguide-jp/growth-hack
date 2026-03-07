import type { PageServerLoad } from "./$types";
import { requireAdmin } from "$lib/server/auth/guards";

export const load: PageServerLoad = (event) => {
  requireAdmin(event);

  return {};
};
