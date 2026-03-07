import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getMediaStorageDriver,
  saveProjectScreenshotBuffer,
} from "$lib/server/media/storage";

const originalMediaStorageDriver = process.env.MEDIA_STORAGE_DRIVER;
const originalBlobToken = process.env.BLOB_READ_WRITE_TOKEN;

afterEach(() => {
  if (originalMediaStorageDriver === undefined) {
    delete process.env.MEDIA_STORAGE_DRIVER;
  } else {
    process.env.MEDIA_STORAGE_DRIVER = originalMediaStorageDriver;
  }

  if (originalBlobToken === undefined) {
    delete process.env.BLOB_READ_WRITE_TOKEN;
  } else {
    process.env.BLOB_READ_WRITE_TOKEN = originalBlobToken;
  }

  vi.restoreAllMocks();
});

describe("media storage driver", () => {
  it("BLOB token がある場合は driver 未設定でも vercel-blob を使う", () => {
    delete process.env.MEDIA_STORAGE_DRIVER;
    process.env.BLOB_READ_WRITE_TOKEN = "blob-token";

    expect(getMediaStorageDriver()).toBe("vercel-blob");
  });

  it("driver が明示されている場合は token より設定を優先する", () => {
    process.env.MEDIA_STORAGE_DRIVER = "local";
    process.env.BLOB_READ_WRITE_TOKEN = "blob-token";

    expect(getMediaStorageDriver()).toBe("local");
  });

  it("serverless bundle 上で local 保存しようとすると設定エラーを返す", async () => {
    process.env.MEDIA_STORAGE_DRIVER = "local";
    delete process.env.BLOB_READ_WRITE_TOKEN;
    vi.spyOn(process, "cwd").mockReturnValue("/var/task");

    await expect(
      saveProjectScreenshotBuffer({
        userId: "user-1",
        projectId: "project-1",
        buffer: Buffer.from("image"),
      }),
    ).rejects.toThrow(
      "この実行環境では local 画像保存を利用できません。MEDIA_STORAGE_DRIVER=vercel-blob と BLOB_READ_WRITE_TOKEN を設定してください。",
    );
  });
});
