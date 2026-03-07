import { describe, expect, it } from "vitest";
import { validateProjectDraftId } from "$lib/server/projects/form";

describe("project draft id validation", () => {
  it("UUID 形式の下書きIDを受け入れる", () => {
    expect(
      validateProjectDraftId("550e8400-e29b-41d4-a716-446655440000").success,
    ).toBe(true);
  });

  it("URL パスとして壊れる下書きIDを reject する", () => {
    expect(validateProjectDraftId("project/foo").success).toBe(false);
  });
});
