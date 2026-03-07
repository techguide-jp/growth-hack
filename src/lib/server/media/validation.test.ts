import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  getProjectScreenshotFileValidationMessage,
  processProjectScreenshotFile,
  validateProcessedProjectScreenshotBuffer,
} from "$lib/server/media/validation";

async function createPngBuffer(options: { width: number; height: number }) {
  return sharp({
    create: {
      width: options.width,
      height: options.height,
      channels: 3,
      background: { r: 32, g: 64, b: 96 },
    },
  })
    .png()
    .toBuffer();
}

describe("server media validation", () => {
  it("raw PNG を canonical webp に変換できる", async () => {
    const pngBuffer = await createPngBuffer({ width: 320, height: 180 });
    const file = new File([new Uint8Array(pngBuffer)], "capture.png", {
      type: "image/png",
    });

    const processed = await processProjectScreenshotFile(file);
    const validationMessage = await validateProcessedProjectScreenshotBuffer({
      buffer: processed,
      contentType: "image/webp",
    });
    const metadata = await sharp(processed).metadata();

    expect(validationMessage).toBeNull();
    expect(metadata.format).toBe("webp");
    expect(metadata.width).toBe(320);
    expect(metadata.height).toBe(180);
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
    const pngBuffer = await createPngBuffer({ width: 10, height: 10 });

    await expect(
      validateProcessedProjectScreenshotBuffer({
        buffer: pngBuffer,
        contentType: "image/png",
      }),
    ).resolves.toBe("保存済みスクリーンショットの content-type が不正です。");
  });
});
