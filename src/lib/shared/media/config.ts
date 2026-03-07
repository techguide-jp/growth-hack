export const MEDIA_STORAGE_DRIVER_VALUES = ["local", "vercel-blob"] as const;
export type MediaStorageDriver = (typeof MEDIA_STORAGE_DRIVER_VALUES)[number];

export const IMAGE_SCOPE_VALUES = ["project-screenshot"] as const;
export type ImageScope = (typeof IMAGE_SCOPE_VALUES)[number];

export const PROJECT_SCREENSHOT_SCOPE = "project-screenshot" as const;
export const PROJECT_SCREENSHOT_MAX_COUNT = 5;
export const PROJECT_SCREENSHOT_MAX_SOURCE_SIZE_BYTES = 20 * 1024 * 1024;
export const PROJECT_SCREENSHOT_MAX_WIDTH = 2000;
export const PROJECT_SCREENSHOT_MAX_HEIGHT = 2000;
export const PROJECT_SCREENSHOT_OUTPUT_MIME_TYPE = "image/webp";
export const PROJECT_SCREENSHOT_OUTPUT_EXTENSION = ".webp";
export const PROJECT_SCREENSHOT_OUTPUT_QUALITY = 0.82;
export const PROJECT_SCREENSHOT_MEDIA_PATH_PREFIX = "media/project-screenshot";
export const PROJECT_SCREENSHOT_MEDIA_URL_PREFIX = `/${PROJECT_SCREENSHOT_MEDIA_PATH_PREFIX}/`;
export const LEGACY_PROJECT_SCREENSHOT_URL_PREFIX = "/uploads/projects/";
export const PROJECT_SCREENSHOT_ACCEPTED_SOURCE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;
export const PROJECT_SCREENSHOT_ACCEPTED_SOURCE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".heic",
  ".heif",
] as const;
export const PROJECT_SCREENSHOT_FILE_INPUT_ACCEPT =
  "image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif";

export type ProjectScreenshotSourceKind =
  | "jpeg"
  | "png"
  | "webp"
  | "heic"
  | "heif"
  | "unknown";

export type ParsedProjectScreenshotPath = {
  scope: typeof PROJECT_SCREENSHOT_SCOPE;
  userId: string;
  projectId: string;
  fileName: string;
  pathname: string;
};

export type ParsedLegacyProjectScreenshotUrl = {
  projectId: string;
  fileName: string;
  pathname: string;
};

function stripQueryAndHash(value: string) {
  return value.split(/[?#]/, 1)[0] ?? value;
}

function trimLeadingSlash(value: string) {
  return value.startsWith("/") ? value.slice(1) : value;
}

export function getImageUrlPathname(url: string) {
  const trimmed = url.trim();

  if (trimmed.length === 0) {
    return null;
  }

  if (trimmed.startsWith("/")) {
    return trimLeadingSlash(stripQueryAndHash(trimmed));
  }

  try {
    const parsed = new URL(trimmed);
    return trimLeadingSlash(parsed.pathname);
  } catch {
    return null;
  }
}

export function toImagePublicUrl(pathname: string) {
  const trimmed = trimLeadingSlash(pathname.trim());
  return `/${trimmed}`;
}

export function createProjectScreenshotPathname(options: {
  userId: string;
  projectId: string;
  timestamp?: number;
  uniqueId?: string;
}) {
  const timestamp = options.timestamp ?? Date.now();
  const uniqueId = options.uniqueId ?? crypto.randomUUID();

  return `${PROJECT_SCREENSHOT_MEDIA_PATH_PREFIX}/user-${options.userId}/project-${options.projectId}/${timestamp}-${uniqueId}${PROJECT_SCREENSHOT_OUTPUT_EXTENSION}`;
}

export function parseProjectScreenshotPathname(pathname: string) {
  const trimmed = trimLeadingSlash(stripQueryAndHash(pathname.trim()));
  const prefix = `${PROJECT_SCREENSHOT_MEDIA_PATH_PREFIX}/user-`;

  if (!trimmed.startsWith(prefix)) {
    return null;
  }

  const parts = trimmed.split("/");

  if (parts.length !== 5) {
    return null;
  }

  const [mediaSegment, scopeSegment, userSegment, projectSegment, fileName] =
    parts;

  if (
    `${mediaSegment}/${scopeSegment}` !==
      PROJECT_SCREENSHOT_MEDIA_PATH_PREFIX ||
    !userSegment.startsWith("user-") ||
    !projectSegment.startsWith("project-") ||
    !fileName.endsWith(PROJECT_SCREENSHOT_OUTPUT_EXTENSION)
  ) {
    return null;
  }

  const userId = userSegment.slice("user-".length);
  const projectId = projectSegment.slice("project-".length);

  if (userId.length === 0 || projectId.length === 0 || fileName.length === 0) {
    return null;
  }

  return {
    scope: PROJECT_SCREENSHOT_SCOPE,
    userId,
    projectId,
    fileName,
    pathname: trimmed,
  } satisfies ParsedProjectScreenshotPath;
}

export function parseProjectScreenshotImageUrl(url: string) {
  const pathname = getImageUrlPathname(url);

  if (!pathname) {
    return null;
  }

  return parseProjectScreenshotPathname(pathname);
}

export function isProjectScreenshotImageUrl(url: string) {
  return Boolean(parseProjectScreenshotImageUrl(url));
}

export function parseLegacyProjectScreenshotUrl(url: string) {
  const pathname = getImageUrlPathname(url);

  if (!pathname) {
    return null;
  }

  const normalized = `/${pathname}`;

  if (!normalized.startsWith(LEGACY_PROJECT_SCREENSHOT_URL_PREFIX)) {
    return null;
  }

  const relativePath = normalized.slice(
    LEGACY_PROJECT_SCREENSHOT_URL_PREFIX.length,
  );
  const parts = relativePath.split("/");

  if (parts.length !== 2) {
    return null;
  }

  const [projectId, fileName] = parts;

  if (
    projectId.length === 0 ||
    fileName.length === 0 ||
    fileName.includes("..")
  ) {
    return null;
  }

  return {
    projectId,
    fileName,
    pathname,
  } satisfies ParsedLegacyProjectScreenshotUrl;
}

export function isLegacyProjectScreenshotUrl(url: string) {
  return Boolean(parseLegacyProjectScreenshotUrl(url));
}

function getFileExtension(name: string | null | undefined) {
  const rawName = name?.trim() ?? "";
  const index = rawName.lastIndexOf(".");

  if (index < 0) {
    return "";
  }

  return rawName.slice(index).toLowerCase();
}

export function inferProjectScreenshotSourceKind(input: {
  type?: string | null;
  name?: string | null;
}): ProjectScreenshotSourceKind {
  const normalizedType = input.type?.trim().toLowerCase() ?? "";

  switch (normalizedType) {
    case "image/jpeg":
    case "image/jpg":
      return "jpeg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/heic":
      return "heic";
    case "image/heif":
      return "heif";
    default:
      break;
  }

  switch (getFileExtension(input.name)) {
    case ".jpg":
    case ".jpeg":
      return "jpeg";
    case ".png":
      return "png";
    case ".webp":
      return "webp";
    case ".heic":
      return "heic";
    case ".heif":
      return "heif";
    default:
      return "unknown";
  }
}

export function isProjectScreenshotSourceSupported(
  kind: ProjectScreenshotSourceKind,
) {
  return kind !== "unknown";
}

export function isHeicLikeProjectScreenshotSource(
  kind: ProjectScreenshotSourceKind,
) {
  return kind === "heic" || kind === "heif";
}

export function toProjectScreenshotOutputFileName(name: string) {
  const trimmed = name.trim();
  const index = trimmed.lastIndexOf(".");
  const stem = index > 0 ? trimmed.slice(0, index) : trimmed;
  return `${stem || "project-screenshot"}${PROJECT_SCREENSHOT_OUTPUT_EXTENSION}`;
}
