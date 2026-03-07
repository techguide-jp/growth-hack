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
import {
  getProjectScreenshotFiles,
  parseKeptProjectScreenshotUrls,
  validateProjectScreenshots,
} from "$lib/server/projects/screenshots";

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
    const keptImageUrls =
      parseKeptProjectScreenshotUrls(formData.get("keptImagesJson"));

    if (keptImageUrls === null) {
      return fail(400, {
        message:
          "スクリーンショット情報の読み取りに失敗しました。画面を再読み込みしてやり直してください。",
        values,
      });
    }

    const screenshotFiles = getProjectScreenshotFiles(formData);
    const screenshotMessage = validateProjectScreenshots({
      files: screenshotFiles,
      keptImageUrls,
      allowedImageUrls: currentProject.images,
    });

    if (screenshotMessage) {
      return fail(400, {
        message: screenshotMessage,
        values: {
          ...values,
          keptImagesJson: JSON.stringify(keptImageUrls),
        },
      });
    }

    const targetStatus = resolveTargetStatus(
      values.statusIntent,
      currentProject.status,
    );
    const result = validateProjectFormValues(values, {
      targetStatus,
      currentStatus: currentProject.status,
      existingImageCount: keptImageUrls.length,
      pendingImageCount: screenshotFiles.length,
    });

    if (!result.success) {
      return fail(400, {
        message: result.message,
        values: {
          ...values,
          keptImagesJson: JSON.stringify(keptImageUrls),
        },
      });
    }

    const project = await updateProject(event.params.id, result.data, {
      keptImageUrls,
      screenshotFiles,
    });

    if (!project) {
      return fail(500, {
        message: "プロジェクトの更新に失敗しました。",
        values: {
          ...values,
          keptImagesJson: JSON.stringify(keptImageUrls),
        },
      });
    }

    throw redirect(303, `/projects/${project.id}`);
  },
};
