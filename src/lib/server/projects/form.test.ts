import { describe, expect, it } from "vitest";
import {
  validateProjectDraftId,
  validateProjectFormValues,
} from "$lib/server/projects/form";
import {
  resolveProjectSuccessToast,
  type ProjectFormValues,
} from "$lib/shared/project-form";

function createValues(
  overrides: Partial<ProjectFormValues> = {},
): ProjectFormValues {
  return {
    title: "Growth Hach",
    oneLiner: "継続開発コミュニティ",
    problemStatement: "",
    projectStage: "",
    helpTypes: "",
    helpRequest: "",
    highlights: "",
    nextMilestone: "",
    feedbackRequest: "",
    backgroundNote: "",
    publicUrl: "",
    repoUrl: "",
    demoUrl: "",
    tags: "",
    uploadedImagesJson: "[]",
    draftProjectId: "550e8400-e29b-41d4-a716-446655440000",
    keptImagesJson: "[]",
    statusIntent: "published",
    ...overrides,
  };
}

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

describe("project form validation", () => {
  it("公開時の不足項目をまとめて返し、先頭項目を示す", () => {
    const result = validateProjectFormValues(
      createValues({
        title: "",
        oneLiner: "",
      }),
      {
        targetStatus: "published",
        currentStatus: "draft",
        existingImageCount: 0,
        pendingImageCount: 0,
      },
    );

    expect(result.success).toBe(false);

    if (result.success) {
      return;
    }

    expect(result.firstErrorField).toBe("title");
    expect(result.errors.title).toEqual(["プロジェクト名を入力してください。"]);
    expect(result.errors.oneLiner).toEqual([
      "ひとことで何を作っているかを入力してください。",
    ]);
    expect(result.errors.problemStatement).toContain(
      "誰のどんな課題を解決するかを入力してください。",
    );
    expect(result.errors.projectStage).toContain(
      "現在のステージを選択してください。",
    );
    expect(result.errors.helpTypes).toContain(
      "今いちばん欲しい協力を1つ以上選択してください。",
    );
    expect(result.errors.helpRequest).toContain(
      "協力してほしい具体的な内容を入力してください。",
    );
    expect(result.errors.highlights).toContain(
      "できること・見どころを1〜3件入力してください。",
    );
    expect(result.errors.nextMilestone).toContain(
      "次のマイルストーンを入力してください。",
    );
    expect(result.errors.feedbackRequest).toContain(
      "見てほしい点 / フィードバックが欲しい点を入力してください。",
    );
    expect(result.errors.tags).toContain("タグを2〜5件入力してください。");
    expect(result.errors.assets).toContain(
      "公開URL・GitHub URL・デモURL・スクリーンショットのいずれか1つを追加してください。",
    );
  });
});

describe("project success toast", () => {
  it("公開時は公開トーストを返す", () => {
    expect(
      resolveProjectSuccessToast({
        mode: "edit",
        statusIntent: "published",
        targetStatus: "published",
        currentStatus: "draft",
      }),
    ).toBe("published");
  });

  it("下書き保存時は下書きトーストを返す", () => {
    expect(
      resolveProjectSuccessToast({
        mode: "create",
        statusIntent: "draft",
        targetStatus: "draft",
      }),
    ).toBe("draft-saved");
  });
});
