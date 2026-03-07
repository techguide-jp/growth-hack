import type {
  ProjectHelpType,
  ProjectStage,
  ProjectStatus,
} from "$lib/shared/domain";

export interface ProjectStatusInfo {
  label: string;
  description: string;
  badgeClass: string;
}

export const PROJECT_STATUS_MAP: Record<ProjectStatus, ProjectStatusInfo> = {
  draft: {
    label: "下書き",
    description: "本人のみ閲覧可。公開前の編集中状態",
    badgeClass: "bg-gray-100 text-gray-600 border-gray-200",
  },
  published: {
    label: "公開中",
    description: "全ユーザーに公開。検索・一覧に表示される",
    badgeClass: "bg-green-50 text-green-700 border-green-200",
  },
  archived: {
    label: "アーカイブ",
    description: "開発終了・凍結。閲覧可だが一覧では非表示",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
};

const FALLBACK: ProjectStatusInfo = {
  label: "不明",
  description: "",
  badgeClass: "bg-gray-100 text-gray-600 border-gray-200",
};

export function getProjectStatusInfo(status: string): ProjectStatusInfo {
  return PROJECT_STATUS_MAP[status as ProjectStatus] ?? FALLBACK;
}

export interface ProjectStageInfo {
  label: string;
  description: string;
  badgeClass: string;
}

export const PROJECT_STAGE_MAP: Record<ProjectStage, ProjectStageInfo> = {
  concept: {
    label: "構想中",
    description: "課題や方向性を固めている段階",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
  },
  prototype: {
    label: "試作中",
    description: "まず動く形を作って検証している段階",
    badgeClass: "bg-sky-100 text-sky-700 border-sky-200",
  },
  beta: {
    label: "ベータ公開",
    description: "使ってもらいながら改善している段階",
    badgeClass: "bg-violet-100 text-violet-700 border-violet-200",
  },
  live: {
    label: "運用中",
    description: "すでに公開・継続運用している段階",
    badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
};

const STAGE_FALLBACK: ProjectStageInfo = {
  label: "未設定",
  description: "",
  badgeClass: "bg-gray-100 text-gray-600 border-gray-200",
};

export function getProjectStageInfo(
  stage: ProjectStage | null | undefined,
): ProjectStageInfo {
  if (!stage) {
    return STAGE_FALLBACK;
  }

  return PROJECT_STAGE_MAP[stage] ?? STAGE_FALLBACK;
}

export interface ProjectHelpTypeInfo {
  label: string;
  description: string;
}

export const PROJECT_SCREENSHOT_MAX_COUNT = 5;
export const PROJECT_SCREENSHOT_MAX_SIZE_BYTES = 5 * 1024 * 1024;

export const PROJECT_HELP_TYPE_MAP: Record<
  ProjectHelpType,
  ProjectHelpTypeInfo
> = {
  feedback: {
    label: "フィードバック",
    description: "方向性や使い勝手への率直な意見がほしい",
  },
  testing: {
    label: "テスト",
    description: "実際に触ってバグや詰まりを見つけてほしい",
  },
  design: {
    label: "デザイン",
    description: "UIや導線の見せ方を一緒に磨きたい",
  },
  frontend: {
    label: "フロントエンド",
    description: "画面実装や体験づくりを手伝ってほしい",
  },
  backend: {
    label: "バックエンド",
    description: "APIやデータ設計まわりを相談したい",
  },
  "ai-data": {
    label: "AI・データ",
    description: "モデル活用やデータ設計の知見がほしい",
  },
  growth: {
    label: "グロース",
    description: "届け方やユーザー獲得を一緒に考えたい",
  },
  teammate: {
    label: "仲間募集",
    description: "継続的に関わるメンバーを探している",
  },
};

export const PROJECT_HELP_TYPE_OPTIONS = Object.entries(
  PROJECT_HELP_TYPE_MAP,
).map(([value, info]) => ({
  value: value as ProjectHelpType,
  ...info,
}));

export function getProjectHelpTypeInfo(
  helpType: ProjectHelpType,
): ProjectHelpTypeInfo {
  return PROJECT_HELP_TYPE_MAP[helpType];
}

export type ProjectPublishChecklistInput = {
  highlights: string[];
  nextMilestone?: string | null;
  feedbackRequest?: string | null;
  tags: string[];
  publicUrl?: string | null;
  repoUrl?: string | null;
  demoUrl?: string | null;
  images?: string[];
};

export type ProjectPublishChecklistItem = {
  id: "highlights" | "nextMilestone" | "feedbackRequest" | "tags" | "assets";
  label: string;
  complete: boolean;
};

function hasValue(value?: string | null) {
  return Boolean(value?.trim());
}

export function getProjectPublishChecklist(
  input: ProjectPublishChecklistInput,
): ProjectPublishChecklistItem[] {
  const hasAsset =
    hasValue(input.publicUrl) ||
    hasValue(input.repoUrl) ||
    hasValue(input.demoUrl) ||
    Boolean(input.images?.length);

  return [
    {
      id: "highlights",
      label: "できること・見どころを1〜3件",
      complete: input.highlights.length >= 1 && input.highlights.length <= 3,
    },
    {
      id: "nextMilestone",
      label: "次のマイルストーン",
      complete: hasValue(input.nextMilestone),
    },
    {
      id: "feedbackRequest",
      label: "見てほしい点 / フィードバックが欲しい点",
      complete: hasValue(input.feedbackRequest),
    },
    {
      id: "tags",
      label: "タグを2〜5件",
      complete: input.tags.length >= 2 && input.tags.length <= 5,
    },
    {
      id: "assets",
      label: "成果物リンクまたはスクリーンショット",
      complete: hasAsset,
    },
  ];
}

export function isProjectPublishReady(input: ProjectPublishChecklistInput) {
  return getProjectPublishChecklist(input).every((item) => item.complete);
}
