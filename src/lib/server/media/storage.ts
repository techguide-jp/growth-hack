import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { del, put } from "@vercel/blob";
import {
  createProjectScreenshotPathname,
  getImageUrlPathname,
  isLegacyProjectScreenshotUrl,
  isProjectScreenshotImageUrl,
  parseLegacyProjectScreenshotUrl,
  parseProjectScreenshotImageUrl,
  PROJECT_SCREENSHOT_MEDIA_PATH_PREFIX,
  PROJECT_SCREENSHOT_OUTPUT_MIME_TYPE,
  toImagePublicUrl,
  type MediaStorageDriver,
} from "$lib/shared/media/config";

const STATIC_ROOT = join(process.cwd(), "static");
const STATIC_MEDIA_ROOT = join(STATIC_ROOT, "media");
const LEGACY_UPLOAD_ROOT = join(STATIC_ROOT, "uploads", "projects");
const VERCEL_BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";
const VERCEL_SERVERLESS_ROOT = "/var/task";

type ProjectScreenshotSaveResult = {
  pathname: string;
  url: string;
};

function toStaticAbsolutePath(pathname: string) {
  const normalized = pathname.trim().replace(/^\/+/, "");

  if (
    normalized.length === 0 ||
    normalized.includes("..") ||
    !normalized.startsWith(PROJECT_SCREENSHOT_MEDIA_PATH_PREFIX)
  ) {
    return null;
  }

  return join(STATIC_ROOT, normalized);
}

function toLegacyAbsolutePath(url: string) {
  const parsed = parseLegacyProjectScreenshotUrl(url);

  if (!parsed) {
    return null;
  }

  return join(LEGACY_UPLOAD_ROOT, parsed.projectId, parsed.fileName);
}

function isManagedBlobUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.endsWith(VERCEL_BLOB_HOST_SUFFIX);
  } catch {
    return false;
  }
}

function getBlobToken() {
  return process.env.BLOB_READ_WRITE_TOKEN;
}

function isServerlessBundleFilesystem() {
  return process.cwd().startsWith(VERCEL_SERVERLESS_ROOT);
}

function getConfiguredMediaStorageDriver() {
  const configuredDriver = process.env.MEDIA_STORAGE_DRIVER?.trim();

  if (configuredDriver === "local" || configuredDriver === "vercel-blob") {
    return configuredDriver;
  }

  return null;
}

export function getMediaStorageDriver(): MediaStorageDriver {
  const configuredDriver = getConfiguredMediaStorageDriver();

  if (configuredDriver) {
    return configuredDriver;
  }

  return getBlobToken() ? "vercel-blob" : "local";
}

function assertLocalMediaStorageAvailable() {
  if (!isServerlessBundleFilesystem()) {
    return;
  }

  throw new Error(
    "この実行環境では local 画像保存を利用できません。MEDIA_STORAGE_DRIVER=vercel-blob と BLOB_READ_WRITE_TOKEN を設定してください。",
  );
}

export function getMediaUploadConfig() {
  const driver = getMediaStorageDriver();

  return {
    driver,
    supportsDirectUpload: driver === "vercel-blob",
  };
}

export async function saveProjectScreenshotBuffer(options: {
  userId: string;
  projectId: string;
  buffer: Buffer;
}) {
  const pathname = createProjectScreenshotPathname({
    userId: options.userId,
    projectId: options.projectId,
  });

  if (getMediaStorageDriver() === "vercel-blob") {
    const token = getBlobToken();

    if (!token) {
      throw new Error("BLOB_READ_WRITE_TOKEN が設定されていません。");
    }

    const result = await put(pathname, options.buffer, {
      access: "public",
      addRandomSuffix: false,
      contentType: PROJECT_SCREENSHOT_OUTPUT_MIME_TYPE,
      token,
    });

    return {
      pathname,
      url: result.url,
    } satisfies ProjectScreenshotSaveResult;
  }

  const absolutePath = toStaticAbsolutePath(pathname);

  if (!absolutePath) {
    throw new Error("画像の保存先が不正です。");
  }

  assertLocalMediaStorageAvailable();

  await mkdir(
    join(
      STATIC_MEDIA_ROOT,
      `project-screenshot/user-${options.userId}/project-${options.projectId}`,
    ),
    {
      recursive: true,
    },
  );
  await writeFile(absolutePath, options.buffer);

  return {
    pathname,
    url: toImagePublicUrl(pathname),
  } satisfies ProjectScreenshotSaveResult;
}

export function validateProjectScreenshotManagedUrl(options: {
  userId: string;
  projectId: string;
  url: string;
}) {
  const parsed = parseProjectScreenshotImageUrl(options.url);

  if (!parsed) {
    return "スクリーンショットの参照先が不正です。";
  }

  if (
    parsed.userId !== options.userId ||
    parsed.projectId !== options.projectId
  ) {
    return "スクリーンショットの所有者またはプロジェクトが一致しません。";
  }

  if (!options.url.trim().startsWith("/") && !isManagedBlobUrl(options.url)) {
    return "管理対象外の画像 URL は利用できません。";
  }

  return null;
}

export async function readProjectScreenshotImage(options: { url: string }) {
  if (isLegacyProjectScreenshotUrl(options.url)) {
    const absolutePath = toLegacyAbsolutePath(options.url);

    if (!absolutePath) {
      throw new Error("legacy 画像のパスを解決できません。");
    }

    const buffer = await readFile(absolutePath);

    return {
      buffer,
      contentType: null,
    };
  }

  if (
    isProjectScreenshotImageUrl(options.url) &&
    options.url.trim().startsWith("/")
  ) {
    const pathname = getImageUrlPathname(options.url);
    const absolutePath = pathname ? toStaticAbsolutePath(pathname) : null;

    if (!absolutePath) {
      throw new Error("画像の保存パスを解決できません。");
    }

    const buffer = await readFile(absolutePath);

    return {
      buffer,
      contentType: PROJECT_SCREENSHOT_OUTPUT_MIME_TYPE,
    };
  }

  if (!isManagedBlobUrl(options.url)) {
    throw new Error("管理対象外の画像 URL は読み込めません。");
  }

  const response = await fetch(options.url);

  if (!response.ok) {
    throw new Error("画像の取得に失敗しました。");
  }

  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get("content-type"),
  };
}

async function deleteLocalFile(absolutePath: string) {
  try {
    await unlink(absolutePath);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return;
    }

    throw error;
  }
}

export async function deleteProjectScreenshotImageUrls(imageUrls: string[]) {
  const uniqueUrls = [
    ...new Set(imageUrls.map((url) => url.trim()).filter(Boolean)),
  ];

  if (uniqueUrls.length === 0) {
    return;
  }

  const blobUrls: string[] = [];
  const localPaths: string[] = [];

  for (const imageUrl of uniqueUrls) {
    if (isLegacyProjectScreenshotUrl(imageUrl)) {
      const absolutePath = toLegacyAbsolutePath(imageUrl);

      if (absolutePath) {
        localPaths.push(absolutePath);
      }

      continue;
    }

    if (isProjectScreenshotImageUrl(imageUrl) && imageUrl.startsWith("/")) {
      const pathname = getImageUrlPathname(imageUrl);
      const absolutePath = pathname ? toStaticAbsolutePath(pathname) : null;

      if (absolutePath) {
        localPaths.push(absolutePath);
      }

      continue;
    }

    if (
      isManagedBlobUrl(imageUrl) &&
      parseProjectScreenshotImageUrl(imageUrl)
    ) {
      blobUrls.push(imageUrl);
    }
  }

  await Promise.all(localPaths.map(deleteLocalFile));

  if (blobUrls.length > 0) {
    const token = getBlobToken();

    if (!token) {
      throw new Error("BLOB_READ_WRITE_TOKEN が設定されていません。");
    }

    await del(blobUrls, { token });
  }
}
