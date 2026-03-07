import {
  inferProjectScreenshotSourceKind,
  isHeicLikeProjectScreenshotSource,
  isProjectScreenshotSourceSupported,
  PROJECT_SCREENSHOT_MAX_HEIGHT,
  PROJECT_SCREENSHOT_MAX_SOURCE_SIZE_BYTES,
  PROJECT_SCREENSHOT_MAX_WIDTH,
  PROJECT_SCREENSHOT_OUTPUT_MIME_TYPE,
} from "$lib/shared/media/config";

const WEBP_RIFF_SIGNATURE = "RIFF";
const WEBP_CONTAINER_SIGNATURE = "WEBP";
const WEBP_CHUNK_HEADER_SIZE = 8;

function readUint24LE(buffer: Buffer, offset: number) {
  if (buffer.length < offset + 3) {
    return null;
  }

  return (
    buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16)
  );
}

function parseWebpDimensionsFromChunk(
  buffer: Buffer,
  chunkType: string,
  payloadOffset: number,
  payloadSize: number,
) {
  switch (chunkType) {
    case "VP8X": {
      if (payloadSize < 10 || buffer.length < payloadOffset + payloadSize) {
        return null;
      }

      const widthMinusOne = readUint24LE(buffer, payloadOffset + 4);
      const heightMinusOne = readUint24LE(buffer, payloadOffset + 7);

      if (widthMinusOne === null || heightMinusOne === null) {
        return null;
      }

      return {
        width: widthMinusOne + 1,
        height: heightMinusOne + 1,
      };
    }
    case "VP8L": {
      if (payloadSize < 5 || buffer.length < payloadOffset + payloadSize) {
        return null;
      }

      if (buffer[payloadOffset] !== 0x2f) {
        return null;
      }

      const bits = buffer.readUInt32LE(payloadOffset + 1);

      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >> 14) & 0x3fff) + 1,
      };
    }
    case "VP8 ": {
      if (payloadSize < 10 || buffer.length < payloadOffset + payloadSize) {
        return null;
      }

      if (
        buffer[payloadOffset + 3] !== 0x9d ||
        buffer[payloadOffset + 4] !== 0x01 ||
        buffer[payloadOffset + 5] !== 0x2a
      ) {
        return null;
      }

      const width = buffer.readUInt16LE(payloadOffset + 6) & 0x3fff;
      const height = buffer.readUInt16LE(payloadOffset + 8) & 0x3fff;

      if (width <= 0 || height <= 0) {
        return null;
      }

      return {
        width,
        height,
      };
    }
    default:
      return null;
  }
}

function getWebpDimensions(buffer: Buffer) {
  if (buffer.length < 12) {
    return null;
  }

  if (
    buffer.toString("ascii", 0, 4) !== WEBP_RIFF_SIGNATURE ||
    buffer.toString("ascii", 8, 12) !== WEBP_CONTAINER_SIGNATURE
  ) {
    return null;
  }

  let offset = 12;

  while (offset + WEBP_CHUNK_HEADER_SIZE <= buffer.length) {
    const chunkType = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const payloadOffset = offset + WEBP_CHUNK_HEADER_SIZE;
    const dimensions = parseWebpDimensionsFromChunk(
      buffer,
      chunkType,
      payloadOffset,
      chunkSize,
    );

    if (dimensions) {
      return dimensions;
    }

    offset = payloadOffset + chunkSize + (chunkSize % 2);
  }

  return null;
}

function getNormalizedProcessedContentType(file: File) {
  if (file.type.trim().length > 0) {
    return file.type;
  }

  const sourceKind = inferProjectScreenshotSourceKind({
    type: file.type,
    name: file.name,
  });

  return sourceKind === "webp" ? PROJECT_SCREENSHOT_OUTPUT_MIME_TYPE : null;
}

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

  const sourceKind = inferProjectScreenshotSourceKind({
    type: file.type,
    name: file.name,
  });

  if (sourceKind !== "webp") {
    throw new Error(
      "スクリーンショットの前処理に失敗しました。もう一度画像を追加してください。",
    );
  }

  const outputBuffer = Buffer.from(await file.arrayBuffer());
  const validationAfterProcess = await validateProcessedProjectScreenshotBuffer(
    {
      buffer: outputBuffer,
      contentType: getNormalizedProcessedContentType(file),
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

  const dimensions = getWebpDimensions(options.buffer);

  if (!dimensions) {
    return "保存済みスクリーンショットの形式が不正です。";
  }

  if (
    dimensions.width > PROJECT_SCREENSHOT_MAX_WIDTH ||
    dimensions.height > PROJECT_SCREENSHOT_MAX_HEIGHT
  ) {
    return "保存済みスクリーンショットのサイズが上限を超えています。";
  }

  return null;
}
