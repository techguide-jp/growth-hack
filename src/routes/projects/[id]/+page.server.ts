import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import {
  getProjectById,
  getProjectViewById,
} from "$lib/server/repositories/projects";
import {
  isProjectSuccessToast,
  type ProjectSuccessToast,
} from "$lib/shared/project-form";

export const load: PageServerLoad = async ({ locals, params, url }) => {
  const rawProject = await getProjectById(params.id);

  if (!rawProject) {
    throw error(404, "プロジェクトが見つかりません。");
  }

  if (
    rawProject.status === "draft" &&
    rawProject.ownerUserId !== locals.user?.id
  ) {
    throw error(404, "プロジェクトが見つかりません。");
  }

  const project = await getProjectViewById(params.id);

  if (!project) {
    throw error(404, "プロジェクトが見つかりません。");
  }

  const toastParam = url.searchParams.get("toast");
  const successToast: ProjectSuccessToast | null = isProjectSuccessToast(
    toastParam,
  )
    ? toastParam
    : null;

  return {
    canEdit: rawProject.ownerUserId === locals.user?.id,
    project,
    successToast,
  };
};
