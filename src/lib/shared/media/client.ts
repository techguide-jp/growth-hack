import {
  inferProjectScreenshotSourceKind,
  isHeicLikeProjectScreenshotSource,
  isProjectScreenshotSourceSupported,
  PROJECT_SCREENSHOT_MAX_HEIGHT,
  PROJECT_SCREENSHOT_MAX_SOURCE_SIZE_BYTES,
  PROJECT_SCREENSHOT_MAX_WIDTH,
  PROJECT_SCREENSHOT_OUTPUT_MIME_TYPE,
  PROJECT_SCREENSHOT_OUTPUT_QUALITY,
  toProjectScreenshotOutputFileName,
} from "$lib/shared/media/config";

export type PreparedProjectScreenshotFile = {
  file: File;
  previewUrl: string;
};

function loadImageFromUrl(objectUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("画像の読み込みに失敗しました。"));
    image.src = objectUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("画像の WebP 変換に失敗しました。"));
      },
      PROJECT_SCREENSHOT_OUTPUT_MIME_TYPE,
      PROJECT_SCREENSHOT_OUTPUT_QUALITY,
    );
  });
}

function getResizedDimensions(width: number, height: number) {
  const ratio = Math.min(
    PROJECT_SCREENSHOT_MAX_WIDTH / width,
    PROJECT_SCREENSHOT_MAX_HEIGHT / height,
    1,
  );

  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

async function decodeSourceBlob(sourceBlob: Blob) {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(sourceBlob);

      return {
        width: bitmap.width,
        height: bitmap.height,
        draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
          ctx.drawImage(bitmap, 0, 0, width, height);
        },
        cleanup() {
          bitmap.close();
        },
      };
    } catch {
      // Fall back to HTMLImageElement decoding.
    }
  }

  const objectUrl = URL.createObjectURL(sourceBlob);

  try {
    const image = await loadImageFromUrl(objectUrl);

    return {
      width: image.naturalWidth,
      height: image.naturalHeight,
      draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
        ctx.drawImage(image, 0, 0, width, height);
      },
      cleanup() {
        URL.revokeObjectURL(objectUrl);
      },
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

async function maybeConvertHeicBlob(file: File) {
  const sourceKind = inferProjectScreenshotSourceKind({
    type: file.type,
    name: file.name,
  });
  const { isHeic, heicTo } = await import("heic-to/csp");
  const heicLikeByMagic = await isHeic(file).catch(() => false);

  if (!isHeicLikeProjectScreenshotSource(sourceKind) && !heicLikeByMagic) {
    return file;
  }

  const converted = await heicTo({
    blob: file,
    type: "image/jpeg",
    quality: 1,
  });

  return converted instanceof Blob
    ? converted
    : new Blob([converted], { type: "image/jpeg" });
}

async function transcodeProjectScreenshotToWebp(file: File) {
  const sourceKind = inferProjectScreenshotSourceKind({
    type: file.type,
    name: file.name,
  });

  if (!isProjectScreenshotSourceSupported(sourceKind)) {
    throw new Error(
      "スクリーンショットは JPEG / PNG / WebP / HEIC / HEIF の画像だけ登録できます。",
    );
  }

  if (file.size > PROJECT_SCREENSHOT_MAX_SOURCE_SIZE_BYTES) {
    throw new Error(
      `スクリーンショットは1枚あたり${Math.floor(PROJECT_SCREENSHOT_MAX_SOURCE_SIZE_BYTES / 1024 / 1024)}MB以内で登録してください。`,
    );
  }

  const sourceBlob = await maybeConvertHeicBlob(file);
  const decoded = await decodeSourceBlob(sourceBlob);

  try {
    const { width, height } = getResizedDimensions(
      decoded.width,
      decoded.height,
    );
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("画像変換用の canvas を初期化できません。");
    }

    decoded.draw(context, width, height);

    const webpBlob = await canvasToBlob(canvas);

    return new File([webpBlob], toProjectScreenshotOutputFileName(file.name), {
      type: PROJECT_SCREENSHOT_OUTPUT_MIME_TYPE,
      lastModified: file.lastModified,
    });
  } finally {
    decoded.cleanup();
  }
}

export async function prepareProjectScreenshotFiles(files: File[]) {
  const preparedFiles: PreparedProjectScreenshotFile[] = [];

  for (const file of files) {
    const preparedFile = await transcodeProjectScreenshotToWebp(file);
    preparedFiles.push({
      file: preparedFile,
      previewUrl: URL.createObjectURL(preparedFile),
    });
  }

  return preparedFiles;
}

export function releasePreparedProjectScreenshotFile(previewUrl: string) {
  URL.revokeObjectURL(previewUrl);
}
