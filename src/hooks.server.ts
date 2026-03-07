import { building } from "$app/environment";
import type { Handle } from "@sveltejs/kit";
import { auth } from "$lib/auth";
import { isUserOnboarded } from "$lib/server/account-settings";
import type { SessionUser } from "$lib/shared/session";

function normalizeSessionUser(
  user: typeof auth.$Infer.Session.user,
): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.image ?? null,
    role: user.role === "admin" ? "admin" : "user",
  };
}

function isAuthRequest(pathname: string) {
  const basePath = auth.options.basePath || "/api/auth";
  const normalizedBasePath = basePath.endsWith("/") ? basePath : `${basePath}/`;

  return pathname === basePath || pathname.startsWith(normalizedBasePath);
}

export const handle: Handle = async ({ event, resolve }) => {
  if (building) {
    return resolve(event);
  }

  if (isAuthRequest(event.url.pathname)) {
    return auth.handler(event.request);
  }

  const session = await auth.api.getSession({
    headers: event.request.headers,
    asResponse: false,
  });

  if (session?.session && session.user) {
    event.locals.user = normalizeSessionUser(session.user);
    event.locals.session = {
      id: session.session.id,
      expiresAt: session.session.expiresAt.toISOString(),
    };
    event.locals.isOnboarded = await isUserOnboarded(session.user.id);
  } else {
    event.locals.user = null;
    event.locals.session = null;
    event.locals.isOnboarded = false;
  }

  return resolve(event);
};
