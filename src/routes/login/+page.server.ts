import type { PageServerLoad } from "./$types";
import { redirect } from "@sveltejs/kit";
import { sanitizeNextPath } from "$lib/shared/navigation";

export const load: PageServerLoad = ({ locals, url }) => {
  const next = sanitizeNextPath(url.searchParams.get("next"), "/dashboard");

  if (locals.user) {
    if (!locals.isOnboarded) {
      throw redirect(302, `/onboarding?next=${encodeURIComponent(next)}`);
    }

    throw redirect(302, next);
  }

  return { next: next };
};
