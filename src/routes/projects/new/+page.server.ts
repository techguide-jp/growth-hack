import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { requireOnboarded } from "$lib/server/auth/guards";
import { createProject } from "$lib/server/repositories/projects";
import {
  getProjectFormValues,
  resolveTargetStatus,
  validateProjectFormValues,
} from "$lib/server/projects/form";

export const load: PageServerLoad = (event) => {
  requireOnboarded(event);

  return {};
};

export const actions: Actions = {
  default: async (event) => {
    const user = requireOnboarded(event);
    const formData = await event.request.formData();
    const values = getProjectFormValues(formData);
    const targetStatus = resolveTargetStatus(values.statusIntent);
    const result = validateProjectFormValues(values, {
      targetStatus,
      currentStatus: "draft",
    });

    if (!result.success) {
      return fail(400, {
        message: result.message,
        values,
      });
    }

    const project = await createProject(user.id, result.data);

    if (!project) {
      return fail(500, {
        message: "プロジェクトの作成に失敗しました。",
        values,
      });
    }

    throw redirect(303, `/projects/${project.id}`);
  },
};
