import {
  deleteProjectScreenshotImageUrls,
  readProjectScreenshotImage,
  saveProjectScreenshotBuffer,
  validateProjectScreenshotManagedUrl,
} from "$lib/server/media/storage";
import { listReferencedProjectScreenshotUrls } from "$lib/server/media/reference-service";
import {
  getProjectScreenshotFileValidationMessage,
  processProjectScreenshotFile,
  validateProcessedProjectScreenshotBuffer,
} from "$lib/server/media/validation";
import { PROJECT_SCREENSHOT_MAX_COUNT } from "$lib/shared/media/config";

const INVALID_SCREENSHOT_SELECTION_MESSAGE =
  "スクリーンショットの指定が不正です。画面を再読み込みしてやり直してください。";

function isFileEntry(value: FormDataEntryValue): value is File {
  return value instanceof File;
}

function parseImageUrlArray(value: FormDataEntryValue | null) {
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
  return parseImageUrlArray(value);
}

export function parseUploadedProjectScreenshotUrls(
  value: FormDataEntryValue | null,
) {
  return parseImageUrlArray(value);
}

export function validateNewProjectScreenshotUrls(keptImageUrls: string[]) {
  if (keptImageUrls.length > 0) {
    return INVALID_SCREENSHOT_SELECTION_MESSAGE;
  }

  return null;
}

export function validateProjectScreenshots(options: {
  files: File[];
  keptImageUrls: string[];
  uploadedImageUrls: string[];
  allowedImageUrls?: string[];
}) {
  const { files, keptImageUrls, uploadedImageUrls, allowedImageUrls } = options;
  const allowedSet = new Set(allowedImageUrls ?? []);

  if (
    allowedImageUrls &&
    keptImageUrls.some((imageUrl) => !allowedSet.has(imageUrl))
  ) {
    return INVALID_SCREENSHOT_SELECTION_MESSAGE;
  }

  if (
    keptImageUrls.length + uploadedImageUrls.length + files.length >
    PROJECT_SCREENSHOT_MAX_COUNT
  ) {
    return `スクリーンショットは${PROJECT_SCREENSHOT_MAX_COUNT}枚まで登録できます。`;
  }

  for (const file of files) {
    const validationMessage = getProjectScreenshotFileValidationMessage(file);

    if (validationMessage) {
      return validationMessage;
    }
  }

  return null;
}

export async function validateStagedProjectScreenshotUrls(options: {
  userId: string;
  projectId: string;
  imageUrls: string[];
}) {
  const uniqueUrls = [
    ...new Set(options.imageUrls.map((url) => url.trim()).filter(Boolean)),
  ];

  for (const imageUrl of uniqueUrls) {
    const ownershipMessage = validateProjectScreenshotManagedUrl({
      userId: options.userId,
      projectId: options.projectId,
      url: imageUrl,
    });

    if (ownershipMessage) {
      return {
        success: false as const,
        message: ownershipMessage,
      };
    }

    try {
      const image = await readProjectScreenshotImage({ url: imageUrl });
      const validationMessage = await validateProcessedProjectScreenshotBuffer({
        buffer: image.buffer,
        contentType: image.contentType,
      });

      if (validationMessage) {
        return {
          success: false as const,
          message: validationMessage,
        };
      }
    } catch {
      return {
        success: false as const,
        message:
          "アップロード済みスクリーンショットの確認に失敗しました。再アップロードしてください。",
      };
    }
  }

  return {
    success: true as const,
    imageUrls: uniqueUrls,
  };
}

export async function saveProjectScreenshotFiles(
  userId: string,
  projectId: string,
  files: File[],
) {
  const imageUrls: string[] = [];

  for (const file of files) {
    const buffer = await processProjectScreenshotFile(file);
    const saved = await saveProjectScreenshotBuffer({
      userId,
      projectId,
      buffer,
    });

    imageUrls.push(saved.url);
  }

  return imageUrls;
}

export async function deleteProjectScreenshotFiles(imageUrls: string[]) {
  await deleteProjectScreenshotImageUrls(imageUrls);
}

export async function cleanupProjectScreenshotFiles(options: {
  userId: string;
  projectId: string;
  imageUrls: string[];
}) {
  const uniqueUrls = [
    ...new Set(options.imageUrls.map((url) => url.trim()).filter(Boolean)),
  ];

  if (uniqueUrls.length === 0) {
    return;
  }

  for (const imageUrl of uniqueUrls) {
    const ownershipMessage = validateProjectScreenshotManagedUrl({
      userId: options.userId,
      projectId: options.projectId,
      url: imageUrl,
    });

    if (ownershipMessage) {
      throw new Error(ownershipMessage);
    }
  }

  const referencedUrls = await listReferencedProjectScreenshotUrls(uniqueUrls);

  if (referencedUrls.length > 0) {
    throw new Error("まだ参照中のスクリーンショットは cleanup できません。");
  }

  await deleteProjectScreenshotImageUrls(uniqueUrls);
}
