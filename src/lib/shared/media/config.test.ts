import { describe, expect, it } from "vitest";
import {
  createProjectScreenshotPathname,
  inferProjectScreenshotSourceKind,
  parseLegacyProjectScreenshotUrl,
  parseProjectScreenshotImageUrl,
  parseProjectScreenshotPathname,
  toImagePublicUrl,
} from "$lib/shared/media/config";

describe("shared media config", () => {
  it("project screenshot の path を生成して解析できる", () => {
    const pathname = createProjectScreenshotPathname({
      userId: "user-1",
      projectId: "project-1",
      timestamp: 1700000000000,
      uniqueId: "image-1",
    });

    expect(pathname).toBe(
      "media/project-screenshot/user-user-1/project-project-1/1700000000000-image-1.webp",
    );
    expect(parseProjectScreenshotPathname(pathname)).toMatchObject({
      userId: "user-1",
      projectId: "project-1",
    });
    expect(
      parseProjectScreenshotImageUrl(toImagePublicUrl(pathname)),
    ).toMatchObject({
      userId: "user-1",
      projectId: "project-1",
    });
  });

  it("legacy URL を project screenshot とは別に解析する", () => {
    expect(
      parseLegacyProjectScreenshotUrl("/uploads/projects/project-1/sample.png"),
    ).toMatchObject({
      projectId: "project-1",
      fileName: "sample.png",
    });
    expect(
      parseProjectScreenshotImageUrl("/uploads/projects/project-1/sample.png"),
    ).toBeNull();
  });

  it("mime と拡張子から source kind を推定する", () => {
    expect(
      inferProjectScreenshotSourceKind({
        type: "image/jpeg",
        name: "capture.jpg",
      }),
    ).toBe("jpeg");
    expect(
      inferProjectScreenshotSourceKind({
        type: "",
        name: "capture.HEIC",
      }),
    ).toBe("heic");
    expect(
      inferProjectScreenshotSourceKind({
        type: "",
        name: "capture.unknown",
      }),
    ).toBe("unknown");
  });
});
