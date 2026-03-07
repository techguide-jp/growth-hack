import { describe, expect, it } from "vitest";
import { validateProjectScreenshots } from "$lib/server/projects/screenshots";

function createFile(name: string, type: string, size: number) {
  return new File([new Uint8Array(size)], name, { type });
}

describe("project screenshot validation", () => {
  it("allowedImageUrls にない kept image を reject する", () => {
    const message = validateProjectScreenshots({
      files: [],
      keptImageUrls: [
        "/media/project-screenshot/user-user-1/project-project-1/a.webp",
      ],
      uploadedImageUrls: [],
      allowedImageUrls: [],
    });

    expect(message).toBe(
      "スクリーンショットの指定が不正です。画面を再読み込みしてやり直してください。",
    );
  });

  it("existing + uploaded + files の合計枚数を制限する", () => {
    const message = validateProjectScreenshots({
      files: [createFile("a.png", "image/png", 10)],
      keptImageUrls: ["1", "2", "3"],
      uploadedImageUrls: ["4", "5"],
    });

    expect(message).toBe("スクリーンショットは5枚まで登録できます。");
  });

  it("raw HEIC file を validation で reject する", () => {
    const message = validateProjectScreenshots({
      files: [createFile("capture.heic", "image/heic", 10)],
      keptImageUrls: [],
      uploadedImageUrls: [],
    });

    expect(message).toBe(
      "HEIC / HEIF はブラウザ変換に対応した環境で追加してください。",
    );
  });
});
