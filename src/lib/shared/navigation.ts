const INTERNAL_REDIRECT_ORIGIN = "http://growth-hach.local";

export function sanitizeNextPath(
  value: string | null | undefined,
  fallback = "/",
) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  try {
    const url = new URL(value, INTERNAL_REDIRECT_ORIGIN);

    if (url.origin !== INTERNAL_REDIRECT_ORIGIN) {
      return fallback;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
