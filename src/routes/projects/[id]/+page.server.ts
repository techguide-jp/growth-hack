import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import {
  getProjectById,
  getProjectViewById,
} from "$lib/server/repositories/projects";

export const load: PageServerLoad = async ({ locals, params }) => {
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

  return {
    canEdit: rawProject.ownerUserId === locals.user?.id,
    project,
  };
};
