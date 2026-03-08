import { afterEach, describe, expect, it } from "vitest";
import { getMediaStorageDriver } from "$lib/server/media/runtime";

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
});

describe("media runtime", () => {
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
});
