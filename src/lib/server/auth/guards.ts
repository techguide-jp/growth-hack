import { error, redirect } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";

type GuardEvent = Pick<RequestEvent, "locals" | "url">;

function getNextPath(url: URL) {
  return `${url.pathname}${url.search}`;
}

export function requireUser(event: GuardEvent) {
  if (!event.locals.user) {
    throw redirect(
      302,
      `/login?next=${encodeURIComponent(getNextPath(event.url))}`,
    );
  }

  return event.locals.user;
}

export function requireOnboarded(event: GuardEvent) {
  const user = requireUser(event);

  if (!event.locals.isOnboarded) {
    throw redirect(
      302,
      `/onboarding?next=${encodeURIComponent(getNextPath(event.url))}`,
    );
  }

  return user;
}

export function requireAdmin(event: GuardEvent) {
  const user = requireOnboarded(event);

  if (user.role !== "admin") {
    throw error(403, "管理者のみアクセスできます。");
  }

  return user;
}
