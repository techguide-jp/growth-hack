import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  PROJECT_SCREENSHOT_MAX_COUNT,
  PROJECT_SCREENSHOT_MAX_SIZE_BYTES,
} from "$lib/constants/project";

const PROJECT_SCREENSHOT_UPLOAD_DIR = join(
  process.cwd(),
  "static",
  "uploads",
  "projects",
);
const PROJECT_SCREENSHOT_URL_PREFIX = "/uploads/projects/";

const PROJECT_SCREENSHOT_EXTENSION_MAP: Record<string, string> = {
  "image/avif": ".avif",
  "image/gif": ".gif",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

function isFileEntry(value: FormDataEntryValue): value is File {
  return value instanceof File;
}

function isProjectScreenshotUrl(url: string) {
  return url.startsWith(PROJECT_SCREENSHOT_URL_PREFIX);
}

function toProjectScreenshotPath(url: string) {
  if (!isProjectScreenshotUrl(url)) {
    return null;
  }

  const relativePath = url.slice(PROJECT_SCREENSHOT_URL_PREFIX.length);

  if (relativePath.length === 0 || relativePath.includes("..")) {
    return null;
  }

  return join(PROJECT_SCREENSHOT_UPLOAD_DIR, relativePath);
}

export function getProjectScreenshotFiles(
  formData: FormData,
  key = "screenshots",
) {
  return formData
    .getAll(key)
    .filter(isFileEntry)
    .filter((file) => file.size > 0);
}

export function parseKeptProjectScreenshotUrls(
  value: FormDataEntryValue | null,
) {
  if (value === null) {
    return [];
  }

  if (typeof value !== "string") {
    return null;
  }

  if (value.trim().length === 0) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return null;
    }

    const urls = parsed
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    return [...new Set(urls)];
  } catch {
    return null;
  }
}

export function validateProjectScreenshots(options: {
  files: File[];
  keptImageUrls: string[];
  allowedImageUrls?: string[];
}) {
  const { files, keptImageUrls, allowedImageUrls } = options;
  const allowedSet = new Set(allowedImageUrls ?? []);

  if (
    allowedImageUrls &&
    keptImageUrls.some((imageUrl) => !allowedSet.has(imageUrl))
  ) {
    return "スクリーンショットの指定が不正です。画面を再読み込みしてやり直してください。";
  }

  if (keptImageUrls.length + files.length > PROJECT_SCREENSHOT_MAX_COUNT) {
    return `スクリーンショットは${PROJECT_SCREENSHOT_MAX_COUNT}枚まで登録できます。`;
  }

  for (const file of files) {
    if (!(file.type in PROJECT_SCREENSHOT_EXTENSION_MAP)) {
      return "スクリーンショットは PNG / JPEG / WebP / GIF / AVIF の画像だけ登録できます。";
    }

    if (file.size > PROJECT_SCREENSHOT_MAX_SIZE_BYTES) {
      return `スクリーンショットは1枚あたり${Math.floor(PROJECT_SCREENSHOT_MAX_SIZE_BYTES / 1024 / 1024)}MB以内で登録してください。`;
    }
  }

  return null;
}

export async function saveProjectScreenshotFiles(
  projectId: string,
  files: File[],
) {
  if (files.length === 0) {
    return [];
  }

  const targetDir = join(PROJECT_SCREENSHOT_UPLOAD_DIR, projectId);
  await mkdir(targetDir, { recursive: true });

  const imageUrls: string[] = [];

  for (const file of files) {
    const extension = PROJECT_SCREENSHOT_EXTENSION_MAP[file.type];
    const fileName = `${crypto.randomUUID()}${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(targetDir, fileName), buffer);
    imageUrls.push(`${PROJECT_SCREENSHOT_URL_PREFIX}${projectId}/${fileName}`);
  }

  return imageUrls;
}

export async function deleteProjectScreenshotFiles(imageUrls: string[]) {
  await Promise.all(
    imageUrls.map(async (imageUrl) => {
      const filePath = toProjectScreenshotPath(imageUrl);

      if (!filePath) {
        return;
      }

      try {
        await unlink(filePath);
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
    }),
  );
}
