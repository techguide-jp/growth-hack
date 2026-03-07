import { describe, expect, it } from "vitest";
import {
  buildProjectScreenshotMutationPlan,
  excludeReferencedProjectScreenshotUrls,
} from "$lib/server/repositories/projects";

describe("project screenshot mutation helpers", () => {
  it("参照中の staged 画像を cleanup 対象から外す", () => {
    expect(
      excludeReferencedProjectScreenshotUrls(
        ["/images/a.webp", "/images/b.webp", "/images/a.webp"],
        ["/images/b.webp"],
      ),
    ).toEqual(["/images/a.webp"]);
  });

  it("staged に回した既存 URL を削除対象に含めない", () => {
    expect(
      buildProjectScreenshotMutationPlan({
        currentImageUrls: ["/images/a.webp", "/images/b.webp"],
        keptImageUrls: ["/images/b.webp"],
        stagedImageUrls: ["/images/a.webp"],
        uploadedImageUrls: ["/images/c.webp"],
      }),
    ).toEqual({
      nextImageUrls: ["/images/b.webp", "/images/a.webp", "/images/c.webp"],
      removedImageUrls: [],
    });
  });
});
