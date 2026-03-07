import {
  getProjectPublishChecklist,
  type ProjectPublishChecklistItem,
} from "$lib/constants/project";
import { z } from "zod";
import {
  createProjectInputSchema,
  type CreateProjectInput,
  type ProjectStatus,
} from "$lib/shared/domain";
import {
  PROJECT_FORM_ERROR_FIELD_ORDER,
  type ProjectFormErrorField,
  type ProjectFormErrors,
  type ProjectFormValues,
} from "$lib/shared/project-form";

type ProjectValidationContext = {
  targetStatus: ProjectStatus;
  currentStatus?: ProjectStatus;
  existingImageCount?: number;
  pendingImageCount?: number;
};

type ValidationResult =
  | {
      success: true;
      data: CreateProjectInput;
      checklist: ProjectPublishChecklistItem[];
    }
  | {
      success: false;
      errors: ProjectFormErrors;
      firstErrorField: ProjectFormErrorField | null;
      checklist: ProjectPublishChecklistItem[];
      message?: string;
    };

function getStringEntry(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function parseDelimitedValues(
  value: FormDataEntryValue | string | null,
) {
  const raw = typeof value === "string" ? value : "";

  return raw
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function getProjectFormValues(formData: FormData): ProjectFormValues {
  return {
    title: getStringEntry(formData, "title"),
    oneLiner: getStringEntry(formData, "oneLiner"),
    problemStatement: getStringEntry(formData, "problemStatement"),
    projectStage: getStringEntry(formData, "projectStage"),
    helpTypes: getStringEntry(formData, "helpTypes"),
    helpRequest: getStringEntry(formData, "helpRequest"),
    highlights: getStringEntry(formData, "highlights"),
    nextMilestone: getStringEntry(formData, "nextMilestone"),
    feedbackRequest: getStringEntry(formData, "feedbackRequest"),
    backgroundNote: getStringEntry(formData, "backgroundNote"),
    publicUrl: getStringEntry(formData, "publicUrl"),
    repoUrl: getStringEntry(formData, "repoUrl"),
    demoUrl: getStringEntry(formData, "demoUrl"),
    tags: getStringEntry(formData, "tags"),
    uploadedImagesJson: getStringEntry(formData, "uploadedImagesJson"),
    draftProjectId: getStringEntry(formData, "draftProjectId"),
    keptImagesJson: getStringEntry(formData, "keptImagesJson"),
    statusIntent: getStringEntry(formData, "statusIntent"),
  };
}

export function validateProjectDraftId(value: string) {
  return z.string().uuid().safeParse(value.trim());
}

export function resolveTargetStatus(
  statusIntent: string,
  currentStatus: ProjectStatus = "draft",
) {
  switch (statusIntent) {
    case "published":
    case "draft":
    case "archived":
      return statusIntent;
    case "keep":
    default:
      return currentStatus;
  }
}

export function getLegacyProjectFoundationGap(project: {
  oneLiner: string;
  problemStatement: string;
  projectStage: string | null;
  helpTypes: string[];
  helpRequest: string;
}) {
  return (
    project.oneLiner.trim().length === 0 ||
    project.problemStatement.trim().length < 10 ||
    !project.projectStage ||
    project.helpTypes.length === 0 ||
    project.helpRequest.trim().length < 10
  );
}

const projectFormErrorFieldSet = new Set<ProjectFormErrorField>(
  PROJECT_FORM_ERROR_FIELD_ORDER,
);

function isProjectFormErrorField(value: string): value is ProjectFormErrorField {
  return projectFormErrorFieldSet.has(value as ProjectFormErrorField);
}

function addProjectFormError(
  errors: ProjectFormErrors,
  field: ProjectFormErrorField,
  message: string,
) {
  const current = errors[field] ?? [];

  if (current.includes(message)) {
    return;
  }

  errors[field] = [...current, message];
}

export function getFirstProjectFormErrorField(errors: ProjectFormErrors) {
  return (
    PROJECT_FORM_ERROR_FIELD_ORDER.find((field) => {
      const fieldErrors = errors[field];
      return Array.isArray(fieldErrors) && fieldErrors.length > 0;
    }) ?? null
  );
}

function mapIssuePathToProjectFormField(
  path: readonly PropertyKey[],
): ProjectFormErrorField | null {
  const [candidate] = path;

  if (typeof candidate !== "string" || !isProjectFormErrorField(candidate)) {
    return null;
  }

  return candidate;
}

function addFoundationRequirementErrors(
  values: ProjectFormValues,
  errors: ProjectFormErrors,
) {
  if (values.problemStatement.trim().length === 0) {
    addProjectFormError(
      errors,
      "problemStatement",
      "誰のどんな課題を解決するかを入力してください。",
    );
  }

  if (values.projectStage.trim().length === 0) {
    addProjectFormError(
      errors,
      "projectStage",
      "現在のステージを選択してください。",
    );
  }

  if (parseDelimitedValues(values.helpTypes).length === 0) {
    addProjectFormError(
      errors,
      "helpTypes",
      "今いちばん欲しい協力を1つ以上選択してください。",
    );
  }

  if (values.helpRequest.trim().length === 0) {
    addProjectFormError(
      errors,
      "helpRequest",
      "協力してほしい具体的な内容を入力してください。",
    );
  }
}

function addPublishRequirementErrors(
  checklist: ProjectPublishChecklistItem[],
  errors: ProjectFormErrors,
) {
  for (const item of checklist) {
    if (item.complete) {
      continue;
    }

    switch (item.id) {
      case "highlights":
        addProjectFormError(
          errors,
          "highlights",
          "できること・見どころを1〜3件入力してください。",
        );
        break;
      case "nextMilestone":
        addProjectFormError(
          errors,
          "nextMilestone",
          "次のマイルストーンを入力してください。",
        );
        break;
      case "feedbackRequest":
        addProjectFormError(
          errors,
          "feedbackRequest",
          "見てほしい点 / フィードバックが欲しい点を入力してください。",
        );
        break;
      case "tags":
        addProjectFormError(
          errors,
          "tags",
          "タグを2〜5件入力してください。",
        );
        break;
      case "assets":
        addProjectFormError(
          errors,
          "assets",
          "公開URL・GitHub URL・デモURL・スクリーンショットのいずれか1つを追加してください。",
        );
        break;
    }
  }
}

function getChecklistImages(
  existingImageCount: number,
  pendingImageCount: number,
) {
  const count = existingImageCount + pendingImageCount;

  if (count === 0) {
    return [];
  }

  return Array.from({ length: count }, (_, index) => `image-${index + 1}`);
}

export function validateProjectFormValues(
  values: ProjectFormValues,
  context: ProjectValidationContext,
): ValidationResult {
  const errors: ProjectFormErrors = {};
  const parsed = createProjectInputSchema.safeParse({
    title: values.title,
    oneLiner: values.oneLiner,
    problemStatement: values.problemStatement,
    projectStage: values.projectStage,
    helpTypes: parseDelimitedValues(values.helpTypes),
    helpRequest: values.helpRequest,
    highlights: parseDelimitedValues(values.highlights),
    nextMilestone: values.nextMilestone,
    feedbackRequest: values.feedbackRequest,
    backgroundNote: values.backgroundNote,
    publicUrl: values.publicUrl,
    repoUrl: values.repoUrl,
    demoUrl: values.demoUrl,
    tags: parseDelimitedValues(values.tags),
    status: context.targetStatus,
    eventIds: [],
  });

  const fallbackChecklist = getProjectPublishChecklist({
    highlights: parseDelimitedValues(values.highlights),
    nextMilestone: values.nextMilestone,
    feedbackRequest: values.feedbackRequest,
    tags: parseDelimitedValues(values.tags),
    publicUrl: values.publicUrl,
    repoUrl: values.repoUrl,
    demoUrl: values.demoUrl,
    images: getChecklistImages(
      context.existingImageCount ?? 0,
      context.pendingImageCount ?? 0,
    ),
  });

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = mapIssuePathToProjectFormField(issue.path);

      if (field) {
        addProjectFormError(errors, field, issue.message);
      }
    }
  }

  const checklist = parsed.success
    ? getProjectPublishChecklist({
        highlights: parsed.data.highlights,
        nextMilestone: parsed.data.nextMilestone,
        feedbackRequest: parsed.data.feedbackRequest,
        tags: parsed.data.tags,
        publicUrl: parsed.data.publicUrl,
        repoUrl: parsed.data.repoUrl,
        demoUrl: parsed.data.demoUrl,
        images: getChecklistImages(
          context.existingImageCount ?? 0,
          context.pendingImageCount ?? 0,
        ),
      })
    : fallbackChecklist;

  if (
    context.targetStatus === "published" &&
    context.currentStatus !== "published"
  ) {
    addFoundationRequirementErrors(values, errors);
    addPublishRequirementErrors(checklist, errors);
  }

  const firstErrorField = getFirstProjectFormErrorField(errors);

  if (firstErrorField) {
    return {
      success: false,
      errors,
      firstErrorField,
      checklist,
    };
  }

  if (!parsed.success) {
    return {
      success: false,
      errors,
      firstErrorField: null,
      checklist,
      message: parsed.error.issues[0]?.message ?? "入力内容を確認してください。",
    };
  }

  return {
    success: true,
    data: parsed.data,
    checklist,
  };
}
