import { createAuthClient } from "better-auth/svelte";

const clientBaseURL =
  typeof window !== "undefined" ? window.location.origin : undefined;

export const authClient = createAuthClient({
  baseURL: clientBaseURL,
  basePath: "/api/auth",
});
