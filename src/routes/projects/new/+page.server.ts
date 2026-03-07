import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { requireOnboarded } from "$lib/server/auth/guards";
import {
  createProject,
  getProjectById,
} from "$lib/server/repositories/projects";
import { getMediaUploadConfig } from "$lib/server/media/storage";
import {
  getProjectFormValues,
  resolveTargetStatus,
  validateProjectDraftId,
  validateProjectFormValues,
} from "$lib/server/projects/form";
import {
  cleanupProjectScreenshotFiles,
  getProjectScreenshotFiles,
  parseUploadedProjectScreenshotUrls,
  parseKeptProjectScreenshotUrls,
  validateNewProjectScreenshotUrls,
  validateStagedProjectScreenshotUrls,
  validateProjectScreenshots,
} from "$lib/server/projects/screenshots";

export const load: PageServerLoad = (event) => {
  const user = requireOnboarded(event);

  return {
    draftProjectId: crypto.randomUUID(),
    mediaUpload: {
      ...getMediaUploadConfig(),
      userId: user.id,
    },
  };
};

export const actions: Actions = {
  default: async (event) => {
    const user = requireOnboarded(event);
    const formData = await event.request.formData();
    const values = getProjectFormValues(formData);
    const draftProjectIdResult = validateProjectDraftId(values.draftProjectId);

    if (!draftProjectIdResult.success) {
      return fail(400, {
        message:
          "下書きIDの読み取りに失敗しました。画面を再読み込みしてやり直してください。",
        values,
      });
    }

    const screenshotFiles = getProjectScreenshotFiles(formData);
    const keptImageUrls = parseKeptProjectScreenshotUrls(
      formData.get("keptImagesJson"),
    );
    const uploadedImageUrls = parseUploadedProjectScreenshotUrls(
      formData.get("uploadedImagesJson"),
    );

    if (keptImageUrls === null || uploadedImageUrls === null) {
      return fail(400, {
        message:
          "スクリーンショット情報の読み取りに失敗しました。画面を再読み込みしてやり直してください。",
        values,
      });
    }

    const createScreenshotMessage =
      validateNewProjectScreenshotUrls(keptImageUrls);

    if (createScreenshotMessage) {
      return fail(400, {
        message: createScreenshotMessage,
        values: {
          ...values,
          draftProjectId: draftProjectIdResult.data,
          keptImagesJson: JSON.stringify([]),
          uploadedImagesJson: JSON.stringify(uploadedImageUrls),
        },
      });
    }

    const duplicateDraftProject = await getProjectById(
      draftProjectIdResult.data,
    );

    if (duplicateDraftProject) {
      await cleanupProjectScreenshotFiles({
        userId: user.id,
        projectId: draftProjectIdResult.data,
        imageUrls: uploadedImageUrls,
      }).catch(() => undefined);

      return fail(400, {
        message:
          "下書きIDが競合しました。画像を含めて再作成するため、もう一度保存してください。",
        values: {
          ...values,
          draftProjectId: crypto.randomUUID(),
          keptImagesJson: JSON.stringify([]),
          uploadedImagesJson: JSON.stringify([]),
        },
      });
    }

    const screenshotMessage = validateProjectScreenshots({
      files: screenshotFiles,
      keptImageUrls,
      uploadedImageUrls,
    });

    if (screenshotMessage) {
      return fail(400, {
        message: screenshotMessage,
        values: {
          ...values,
          draftProjectId: draftProjectIdResult.data,
          keptImagesJson: JSON.stringify(keptImageUrls),
          uploadedImagesJson: JSON.stringify(uploadedImageUrls),
        },
      });
    }

    const validatedUploadedImageUrls =
      await validateStagedProjectScreenshotUrls({
        userId: user.id,
        projectId: draftProjectIdResult.data,
        imageUrls: uploadedImageUrls,
      });

    if (!validatedUploadedImageUrls.success) {
      return fail(400, {
        message: validatedUploadedImageUrls.message,
        values: {
          ...values,
          draftProjectId: draftProjectIdResult.data,
          keptImagesJson: JSON.stringify(keptImageUrls),
          uploadedImagesJson: JSON.stringify(uploadedImageUrls),
        },
      });
    }

    const targetStatus = resolveTargetStatus(values.statusIntent);
    const result = validateProjectFormValues(values, {
      targetStatus,
      currentStatus: "draft",
      existingImageCount: validatedUploadedImageUrls.imageUrls.length,
      pendingImageCount: screenshotFiles.length,
    });

    if (!result.success) {
      return fail(400, {
        message: result.message,
        values: {
          ...values,
          draftProjectId: draftProjectIdResult.data,
          keptImagesJson: JSON.stringify(keptImageUrls),
          uploadedImagesJson: JSON.stringify(
            validatedUploadedImageUrls.imageUrls,
          ),
        },
      });
    }

    const project = await createProject(user.id, result.data, {
      projectId: draftProjectIdResult.data,
      uploaderUserId: user.id,
      screenshotFiles,
      stagedImageUrls: validatedUploadedImageUrls.imageUrls,
    });

    if (!project) {
      return fail(500, {
        message: "プロジェクトの作成に失敗しました。",
        values: {
          ...values,
          draftProjectId: draftProjectIdResult.data,
          keptImagesJson: JSON.stringify(keptImageUrls),
          uploadedImagesJson: JSON.stringify(
            validatedUploadedImageUrls.imageUrls,
          ),
        },
      });
    }

    throw redirect(303, `/projects/${project.id}`);
  },
};
