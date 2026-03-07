import { fail, redirect, error } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { requireOnboarded } from "$lib/server/auth/guards";
import { requireProjectOwner } from "$lib/server/auth/permissions";
import {
  getProjectViewById,
  updateProject,
} from "$lib/server/repositories/projects";
import { updateProjectInputSchema } from "$lib/shared/domain";

function parseTags(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

type ProjectFormValues = {
  title: string;
  summary: string;
  description: string;
  publicUrl: string;
  repoUrl: string;
  demoUrl: string;
  tags: string;
  status: string;
};

function getStringEntry(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getProjectFormValues(formData: FormData): ProjectFormValues {
  return {
    title: getStringEntry(formData, "title"),
    summary: getStringEntry(formData, "summary"),
    description: getStringEntry(formData, "description"),
    publicUrl: getStringEntry(formData, "publicUrl"),
    repoUrl: getStringEntry(formData, "repoUrl"),
    demoUrl: getStringEntry(formData, "demoUrl"),
    tags: getStringEntry(formData, "tags"),
    status: getStringEntry(formData, "status"),
  };
}

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
    const formData = await event.request.formData();
    const values = getProjectFormValues(formData);

    const parsed = updateProjectInputSchema.safeParse({
      title: values.title,
      summary: values.summary,
      description: values.description,
      publicUrl: values.publicUrl,
      repoUrl: values.repoUrl,
      demoUrl: values.demoUrl,
      tags: parseTags(formData.get("tags")),
      status: values.status,
    });

    if (!parsed.success) {
      return fail(400, {
        message:
          parsed.error.issues[0]?.message ??
          "入力内容を確認してください。",
        values,
      });
    }

    const project = await updateProject(event.params.id, parsed.data);

    if (!project) {
      return fail(500, {
        message: "プロジェクトの更新に失敗しました。",
        values,
      });
    }

    throw redirect(303, `/projects/${project.id}`);
  },
};
