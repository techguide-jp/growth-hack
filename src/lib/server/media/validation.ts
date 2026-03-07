import sharp from "sharp";
import {
  inferProjectScreenshotSourceKind,
  isHeicLikeProjectScreenshotSource,
  isProjectScreenshotSourceSupported,
  PROJECT_SCREENSHOT_MAX_HEIGHT,
  PROJECT_SCREENSHOT_MAX_SOURCE_SIZE_BYTES,
  PROJECT_SCREENSHOT_MAX_WIDTH,
  PROJECT_SCREENSHOT_OUTPUT_MIME_TYPE,
  PROJECT_SCREENSHOT_OUTPUT_QUALITY,
} from "$lib/shared/media/config";

export function getProjectScreenshotFileValidationMessage(file: File) {
  const sourceKind = inferProjectScreenshotSourceKind({
    type: file.type,
    name: file.name,
  });

  if (!isProjectScreenshotSourceSupported(sourceKind)) {
    return "スクリーンショットは JPEG / PNG / WebP / HEIC / HEIF の画像だけ登録できます。";
  }

  if (file.size > PROJECT_SCREENSHOT_MAX_SOURCE_SIZE_BYTES) {
    return `スクリーンショットは1枚あたり${Math.floor(PROJECT_SCREENSHOT_MAX_SOURCE_SIZE_BYTES / 1024 / 1024)}MB以内で登録してください。`;
  }

  if (isHeicLikeProjectScreenshotSource(sourceKind)) {
    return "HEIC / HEIF はブラウザ変換に対応した環境で追加してください。";
  }

  return null;
}

export async function processProjectScreenshotFile(file: File) {
  const validationMessage = getProjectScreenshotFileValidationMessage(file);

  if (validationMessage) {
    throw new Error(validationMessage);
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const outputBuffer = await sharp(inputBuffer, { failOn: "error" })
    .rotate()
    .resize({
      width: PROJECT_SCREENSHOT_MAX_WIDTH,
      height: PROJECT_SCREENSHOT_MAX_HEIGHT,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      quality: Math.round(PROJECT_SCREENSHOT_OUTPUT_QUALITY * 100),
    })
    .toBuffer();

  const validationAfterProcess = await validateProcessedProjectScreenshotBuffer(
    {
      buffer: outputBuffer,
      contentType: PROJECT_SCREENSHOT_OUTPUT_MIME_TYPE,
    },
  );

  if (validationAfterProcess) {
    throw new Error(validationAfterProcess);
  }

  return outputBuffer;
}

export async function validateProcessedProjectScreenshotBuffer(options: {
  buffer: Buffer;
  contentType?: string | null;
}) {
  if (
    options.contentType &&
    !options.contentType
      .toLowerCase()
      .includes(PROJECT_SCREENSHOT_OUTPUT_MIME_TYPE)
  ) {
    return "保存済みスクリーンショットの content-type が不正です。";
  }

  if (options.buffer.byteLength > PROJECT_SCREENSHOT_MAX_SOURCE_SIZE_BYTES) {
    return `保存済みスクリーンショットが大きすぎます。${Math.floor(PROJECT_SCREENSHOT_MAX_SOURCE_SIZE_BYTES / 1024 / 1024)}MB以内にしてください。`;
  }

  try {
    const metadata = await sharp(options.buffer, {
      failOn: "error",
    }).metadata();

    if (metadata.format !== "webp") {
      return "保存済みスクリーンショットの形式が不正です。";
    }

    if (!metadata.width || !metadata.height) {
      return "保存済みスクリーンショットのサイズを判定できません。";
    }

    if (
      metadata.width > PROJECT_SCREENSHOT_MAX_WIDTH ||
      metadata.height > PROJECT_SCREENSHOT_MAX_HEIGHT
    ) {
      return "保存済みスクリーンショットのサイズが上限を超えています。";
    }

    return null;
  } catch {
    return "保存済みスクリーンショットを検証できませんでした。";
  }
}
