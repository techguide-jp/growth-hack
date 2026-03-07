import type { PageServerLoad } from "./$types";
import { requireOnboarded } from "$lib/server/auth/guards";

export const load: PageServerLoad = (event) => {
  requireOnboarded(event);

  return {};
};
