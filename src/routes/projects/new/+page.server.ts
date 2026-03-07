import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { requireOnboarded } from "$lib/server/auth/guards";
import { createProject } from "$lib/server/repositories/projects";
import {
  getProjectFormValues,
  resolveTargetStatus,
  validateProjectFormValues,
} from "$lib/server/projects/form";
import {
  getProjectScreenshotFiles,
  validateProjectScreenshots,
} from "$lib/server/projects/screenshots";

export const load: PageServerLoad = (event) => {
  requireOnboarded(event);

  return {};
};

export const actions: Actions = {
  default: async (event) => {
    const user = requireOnboarded(event);
    const formData = await event.request.formData();
    const values = getProjectFormValues(formData);
    const screenshotFiles = getProjectScreenshotFiles(formData);
    const screenshotMessage = validateProjectScreenshots({
      files: screenshotFiles,
      keptImageUrls: [],
    });

    if (screenshotMessage) {
      return fail(400, {
        message: screenshotMessage,
        values,
      });
    }

    const targetStatus = resolveTargetStatus(values.statusIntent);
    const result = validateProjectFormValues(values, {
      targetStatus,
      currentStatus: "draft",
      pendingImageCount: screenshotFiles.length,
    });

    if (!result.success) {
      return fail(400, {
        message: result.message,
        values,
      });
    }

    const project = await createProject(user.id, result.data, {
      screenshotFiles,
    });

    if (!project) {
      return fail(500, {
        message: "プロジェクトの作成に失敗しました。",
        values,
      });
    }

    throw redirect(303, `/projects/${project.id}`);
  },
};
