import { error } from "@sveltejs/kit";
import {
  getConversationById,
  isConversationMember,
} from "$lib/server/repositories/conversations";
import {
  getProjectById,
  isProjectMember,
  isProjectOwner,
} from "$lib/server/repositories/projects";

export async function requireProjectExists(projectId: string) {
  const project = await getProjectById(projectId);

  if (!project) {
    throw error(404, "プロジェクトが見つかりません。");
  }

  return project;
}

export async function requireProjectOwner(userId: string, projectId: string) {
  const project = await requireProjectExists(projectId);

  if (!(await isProjectOwner(projectId, userId))) {
    throw error(403, "プロジェクトオーナーのみ操作できます。");
  }

  return project;
}

export async function requireProjectMember(userId: string, projectId: string) {
  const project = await requireProjectExists(projectId);

  if (!(await isProjectMember(projectId, userId))) {
    throw error(403, "プロジェクトメンバーのみアクセスできます。");
  }

  return project;
}

export async function requireConversationMember(
  userId: string,
  conversationId: string,
) {
  const conversation = await getConversationById(conversationId);

  if (!conversation) {
    throw error(404, "会話が見つかりません。");
  }

  if (!(await isConversationMember(conversationId, userId))) {
    throw error(403, "会話の参加者のみアクセスできます。");
  }

  return conversation;
}
