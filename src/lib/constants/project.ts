import type { ProjectStatus } from "$lib/stores/mock/data";

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
