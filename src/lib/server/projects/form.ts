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
      message: string;
      checklist: ProjectPublishChecklistItem[];
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

function getFoundationRequirementMessage(input: CreateProjectInput) {
  if (!input.problemStatement) {
    return "誰のどんな課題を解決するかを入力してください。";
  }

  if (!input.projectStage) {
    return "現在のステージを選択してください。";
  }

  if (input.helpTypes.length === 0) {
    return "今いちばん欲しい協力を1つ以上選択してください。";
  }

  if (!input.helpRequest) {
    return "協力してほしい具体的な内容を入力してください。";
  }

  return null;
}

function getPublishRequirementMessage(
  checklist: ProjectPublishChecklistItem[],
) {
  const missing = checklist.find((item) => !item.complete);

  if (!missing) {
    return null;
  }

  return `公開前チェックが未完了です。「${missing.label}」を埋めてください。`;
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
    return {
      success: false,
      message:
        parsed.error.issues[0]?.message ?? "入力内容を確認してください。",
      checklist: fallbackChecklist,
    };
  }

  const checklist = getProjectPublishChecklist({
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
  });

  if (
    context.targetStatus === "published" &&
    context.currentStatus !== "published"
  ) {
    const foundationRequirementMessage = getFoundationRequirementMessage(
      parsed.data,
    );

    if (foundationRequirementMessage) {
      return {
        success: false,
        message: foundationRequirementMessage,
        checklist,
      };
    }

    const publishRequirementMessage = getPublishRequirementMessage(checklist);

    if (publishRequirementMessage) {
      return {
        success: false,
        message: publishRequirementMessage,
        checklist,
      };
    }
  }

  return {
    success: true,
    data: parsed.data,
    checklist,
  };
}
