import type { ProjectStatus } from "$lib/shared/domain";

export type ProjectFormValues = {
  title: string;
  oneLiner: string;
  problemStatement: string;
  projectStage: string;
  helpTypes: string;
  helpRequest: string;
  highlights: string;
  nextMilestone: string;
  feedbackRequest: string;
  backgroundNote: string;
  publicUrl: string;
  repoUrl: string;
  demoUrl: string;
  tags: string;
  uploadedImagesJson: string;
  draftProjectId: string;
  keptImagesJson: string;
  statusIntent: string;
};

export const PROJECT_FORM_ERROR_FIELD_ORDER = [
  "title",
  "oneLiner",
  "problemStatement",
  "projectStage",
  "helpTypes",
  "helpRequest",
  "highlights",
  "nextMilestone",
  "feedbackRequest",
  "tags",
  "publicUrl",
  "repoUrl",
  "demoUrl",
  "assets",
  "screenshots",
  "backgroundNote",
] as const;

export type ProjectFormErrorField =
  (typeof PROJECT_FORM_ERROR_FIELD_ORDER)[number];

export type ProjectFormErrors = Partial<
  Record<ProjectFormErrorField, string[]>
>;

export type ProjectFormSubmissionState = {
  message?: string;
  values?: Partial<ProjectFormValues>;
  errors?: ProjectFormErrors;
  firstErrorField?: ProjectFormErrorField | null;
};

export function hasProjectFormErrors(errors?: ProjectFormErrors | null) {
  return Boolean(
    errors &&
      Object.values(errors).some(
        (messages) => Array.isArray(messages) && messages.length > 0,
      ),
  );
}

export const PROJECT_SUCCESS_TOAST_VALUES = [
  "draft-saved",
  "published",
  "saved",
  "drafted",
  "archived",
] as const;

export type ProjectSuccessToast =
  (typeof PROJECT_SUCCESS_TOAST_VALUES)[number];

export function isProjectSuccessToast(
  value: string | null | undefined,
): value is ProjectSuccessToast {
  return (
    typeof value === "string" &&
    PROJECT_SUCCESS_TOAST_VALUES.includes(value as ProjectSuccessToast)
  );
}

export function resolveProjectSuccessToast(options: {
  mode: "create" | "edit";
  statusIntent: string;
  targetStatus: ProjectStatus;
  currentStatus?: ProjectStatus;
}): ProjectSuccessToast {
  if (options.targetStatus === "published") {
    return options.statusIntent === "published" ? "published" : "saved";
  }

  if (options.targetStatus === "archived") {
    return "archived";
  }

  if (options.targetStatus === "draft") {
    if (options.mode === "create") {
      return "draft-saved";
    }

    if (options.currentStatus && options.currentStatus !== "draft") {
      return options.statusIntent === "draft" ? "drafted" : "saved";
    }

    return "draft-saved";
  }

  return "saved";
}

export function getProjectSuccessToastMessage(toast: ProjectSuccessToast) {
  switch (toast) {
    case "draft-saved":
      return "下書きを保存しました。";
    case "published":
      return "プロジェクトを公開しました。";
    case "drafted":
      return "プロジェクトを下書きに戻しました。";
    case "archived":
      return "プロジェクトをアーカイブしました。";
    case "saved":
    default:
      return "保存しました。";
  }
}
