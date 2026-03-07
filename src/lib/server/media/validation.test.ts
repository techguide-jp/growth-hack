import { describe, expect, it } from "vitest";
import {
  getProjectScreenshotFileValidationMessage,
  processProjectScreenshotFile,
  validateProcessedProjectScreenshotBuffer,
} from "$lib/server/media/validation";

function createWebpBuffer(options: { width: number; height: number }) {
  const widthMinusOne = options.width - 1;
  const heightMinusOne = options.height - 1;
  const payload = Buffer.from([
    0x00,
    0x00,
    0x00,
    0x00,
    widthMinusOne & 0xff,
    (widthMinusOne >> 8) & 0xff,
    (widthMinusOne >> 16) & 0xff,
    heightMinusOne & 0xff,
    (heightMinusOne >> 8) & 0xff,
    (heightMinusOne >> 16) & 0xff,
  ]);
  const chunkSize = payload.length;
  const fileSize = 4 + 4 + 4 + 4 + payload.length;
  const buffer = Buffer.alloc(8 + fileSize);

  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(fileSize, 4);
  buffer.write("WEBP", 8, "ascii");
  buffer.write("VP8X", 12, "ascii");
  buffer.writeUInt32LE(chunkSize, 16);
  payload.copy(buffer, 20);

  return buffer;
}

describe("server media validation", () => {
  it("processed webp をそのまま受け入れられる", async () => {
    const webpBuffer = createWebpBuffer({ width: 320, height: 180 });
    const file = new File([new Uint8Array(webpBuffer)], "capture.webp", {
      type: "image/webp",
    });

    const processed = await processProjectScreenshotFile(file);
    const validationMessage = await validateProcessedProjectScreenshotBuffer({
      buffer: processed,
      contentType: "image/webp",
    });

    expect(validationMessage).toBeNull();
    expect(processed.equals(webpBuffer)).toBe(true);
  });

  it("HEIC raw file はブラウザ変換前提として server upload では弾く", () => {
    const file = new File([new Uint8Array([0, 1, 2])], "capture.heic", {
      type: "image/heic",
    });

    expect(getProjectScreenshotFileValidationMessage(file)).toBe(
      "HEIC / HEIF はブラウザ変換に対応した環境で追加してください。",
    );
  });

  it("webp 以外の保存済み buffer を reject する", async () => {
    const pngLikeBuffer = Buffer.from("not-a-webp");

    await expect(
      validateProcessedProjectScreenshotBuffer({
        buffer: pngLikeBuffer,
        contentType: "image/webp",
      }),
    ).resolves.toBe("保存済みスクリーンショットの形式が不正です。");
  });

  it("上限を超えるサイズの webp を reject する", async () => {
    const oversizedWebp = createWebpBuffer({ width: 2200, height: 180 });

    await expect(
      validateProcessedProjectScreenshotBuffer({
        buffer: oversizedWebp,
        contentType: "image/webp",
      }),
    ).resolves.toBe("保存済みスクリーンショットのサイズが上限を超えています。");
  });
});
