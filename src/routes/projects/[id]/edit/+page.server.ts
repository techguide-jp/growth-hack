import { fail, redirect, error } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { requireOnboarded } from "$lib/server/auth/guards";
import { requireProjectOwner } from "$lib/server/auth/permissions";
import {
  getProjectViewById,
  updateProject,
} from "$lib/server/repositories/projects";
import {
  getProjectFormValues,
  resolveTargetStatus,
  validateProjectFormValues,
} from "$lib/server/projects/form";

export const load: PageServerLoad = async (event) => {
  const user = requireOnboarded(event);
  await requireProjectOwner(user.id, event.params.id);
  const project = await getProjectViewById(event.params.id);

  if (!project) {
    throw error(404, "プロジェクトが見つかりません。");
  }

  return {
    project,
  };
};

export const actions: Actions = {
  default: async (event) => {
    const user = requireOnboarded(event);
    await requireProjectOwner(user.id, event.params.id);
    const currentProject = await getProjectViewById(event.params.id);

    if (!currentProject) {
      throw error(404, "プロジェクトが見つかりません。");
    }

    const formData = await event.request.formData();
    const values = getProjectFormValues(formData);
    const targetStatus = resolveTargetStatus(
      values.statusIntent,
      currentProject.status,
    );
    const result = validateProjectFormValues(values, {
      targetStatus,
      currentStatus: currentProject.status,
      existingImageCount: currentProject.images.length,
      requireDraftRequirements:
        currentProject.status === "draft" ||
        (targetStatus === "published" && currentProject.status !== "published"),
    });

    if (!result.success) {
      return fail(400, {
        message: result.message,
        values,
      });
    }

    const project = await updateProject(event.params.id, result.data);

    if (!project) {
      return fail(500, {
        message: "プロジェクトの更新に失敗しました。",
        values,
      });
    }

    throw redirect(303, `/projects/${project.id}`);
  },
};
