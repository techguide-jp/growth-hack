import { eq, inArray } from "drizzle-orm";
import { getDb } from "$lib/server/db";
import {
  projectEvents,
  projectMembers,
  projectScreenshots,
  projectTags,
  projects,
  tags,
} from "$lib/server/db/schema";
import { listReferencedProjectScreenshotUrls } from "$lib/server/media/reference-service";
import {
  buildProjectScreenshotMutationPlan,
  excludeReferencedProjectScreenshotUrls,
  getProjectViewById,
} from "$lib/server/repositories/projects";
import {
  deleteProjectScreenshotFiles,
  saveProjectScreenshotFiles,
} from "$lib/server/projects/screenshots";
import type { CreateProjectInput, UpdateProjectInput } from "$lib/shared/domain";

type ProjectAssetOptions = {
  projectId?: string;
  keptImageUrls?: string[];
  screenshotFiles?: File[];
  stagedImageUrls?: string[];
  uploaderUserId: string;
};

function mergeProjectScreenshotUrls(...groups: string[][]) {
  return [...new Set(groups.flatMap((group) => group))];
}

async function cleanupUnreferencedProjectScreenshotFiles(imageUrls: string[]) {
  const uniqueUrls = mergeProjectScreenshotUrls(imageUrls);

  if (uniqueUrls.length === 0) {
    return;
  }

  const referencedImageUrls =
    await listReferencedProjectScreenshotUrls(uniqueUrls);
  const deletableImageUrls = excludeReferencedProjectScreenshotUrls(
    uniqueUrls,
    referencedImageUrls,
  );

  if (deletableImageUrls.length === 0) {
    return;
  }

  await deleteProjectScreenshotFiles(deletableImageUrls);
}

async function syncProjectTags(
  tx: any,
  projectId: string,
  names: string[],
  now: Date,
) {
  if (names.length === 0) {
    return;
  }

  await tx
    .insert(tags)
    .values(
      names.map((name) => ({
        id: crypto.randomUUID(),
        name,
        createdAt: now,
      })),
    )
    .onConflictDoNothing();

  const persistedTags = await tx
    .select()
    .from(tags)
    .where(inArray(tags.name, names));

  if (persistedTags.length === 0) {
    return;
  }

  await tx
    .insert(projectTags)
    .values(
      persistedTags.map((tag: { id: string }) => ({
        projectId,
        tagId: tag.id,
      })),
    )
    .onConflictDoNothing();
}

async function syncProjectScreenshots(
  tx: any,
  projectId: string,
  imageUrls: string[],
  now: Date,
) {
  await tx
    .delete(projectScreenshots)
    .where(eq(projectScreenshots.projectId, projectId));

  if (imageUrls.length === 0) {
    return;
  }

  await tx.insert(projectScreenshots).values(
    imageUrls.map((imageUrl, index) => ({
      id: crypto.randomUUID(),
      projectId,
      imageUrl,
      sortOrder: index,
      createdAt: now,
    })),
  );
}

export async function createProject(
  ownerUserId: string,
  input: CreateProjectInput,
  options: ProjectAssetOptions,
) {
  const db = getDb();
  const projectId = options.projectId ?? crypto.randomUUID();
  const now = new Date();
  const uploadedImageUrls = await saveProjectScreenshotFiles(
    options.uploaderUserId,
    projectId,
    options.screenshotFiles ?? [],
  );
  const stagedImageUrls = options.stagedImageUrls ?? [];
  const nextImageUrls = mergeProjectScreenshotUrls(
    stagedImageUrls,
    uploadedImageUrls,
  );

  try {
    await db.transaction(async (tx) => {
      await tx.insert(projects).values({
        id: projectId,
        ownerUserId,
        title: input.title,
        summary: input.oneLiner,
        problemStatement: input.problemStatement ?? "",
        projectStage: input.projectStage ?? null,
        helpTypes: input.helpTypes,
        helpRequest: input.helpRequest ?? "",
        highlights: input.highlights,
        nextMilestone: input.nextMilestone ?? "",
        feedbackRequest: input.feedbackRequest ?? "",
        description: input.backgroundNote ?? "",
        publicUrl: input.publicUrl ?? null,
        repoUrl: input.repoUrl ?? null,
        demoUrl: input.demoUrl ?? null,
        status: input.status,
        createdAt: now,
        updatedAt: now,
      });

      await tx.insert(projectMembers).values({
        projectId,
        userId: ownerUserId,
        memberRole: "owner",
        joinedAt: now,
      });

      if (input.eventIds.length > 0) {
        await tx
          .insert(projectEvents)
          .values(
            input.eventIds.map((eventId) => ({
              projectId,
              eventId,
            })),
          )
          .onConflictDoNothing();
      }

      await syncProjectTags(tx, projectId, input.tags, now);
      await syncProjectScreenshots(tx, projectId, nextImageUrls, now);
    });
  } catch (error) {
    await cleanupUnreferencedProjectScreenshotFiles([
      ...stagedImageUrls,
      ...uploadedImageUrls,
    ]);
    throw error;
  }

  return getProjectViewById(projectId);
}

export async function updateProject(
  projectId: string,
  input: UpdateProjectInput,
  options: ProjectAssetOptions,
) {
  const db = getDb();
  const now = new Date();
  const currentProject = await getProjectViewById(projectId);

  if (!currentProject) {
    return null;
  }

  const updateValues: Partial<typeof projects.$inferInsert> = {
    updatedAt: now,
  };
  const keptImageUrls = options.keptImageUrls ?? currentProject.images;
  const uploadedImageUrls = await saveProjectScreenshotFiles(
    options.uploaderUserId,
    projectId,
    options.screenshotFiles ?? [],
  );
  const stagedImageUrls = options.stagedImageUrls ?? [];
  const { nextImageUrls, removedImageUrls } =
    buildProjectScreenshotMutationPlan({
      currentImageUrls: currentProject.images,
      keptImageUrls,
      stagedImageUrls,
      uploadedImageUrls,
    });

  if (input.title !== undefined) {
    updateValues.title = input.title;
  }

  if (input.oneLiner !== undefined) {
    updateValues.summary = input.oneLiner;
  }

  if (input.problemStatement !== undefined) {
    updateValues.problemStatement = input.problemStatement ?? "";
  }

  if ("projectStage" in input) {
    updateValues.projectStage = input.projectStage ?? null;
  }

  if (input.helpTypes !== undefined) {
    updateValues.helpTypes = input.helpTypes;
  }

  if (input.helpRequest !== undefined) {
    updateValues.helpRequest = input.helpRequest ?? "";
  }

  if (input.highlights !== undefined) {
    updateValues.highlights = input.highlights;
  }

  if (input.nextMilestone !== undefined) {
    updateValues.nextMilestone = input.nextMilestone ?? "";
  }

  if (input.feedbackRequest !== undefined) {
    updateValues.feedbackRequest = input.feedbackRequest ?? "";
  }

  if (input.backgroundNote !== undefined) {
    updateValues.description = input.backgroundNote ?? "";
  }

  if ("publicUrl" in input) {
    updateValues.publicUrl = input.publicUrl ?? null;
  }

  if ("repoUrl" in input) {
    updateValues.repoUrl = input.repoUrl ?? null;
  }

  if ("demoUrl" in input) {
    updateValues.demoUrl = input.demoUrl ?? null;
  }

  if (input.status !== undefined) {
    updateValues.status = input.status;
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(projects)
        .set(updateValues)
        .where(eq(projects.id, projectId));

      if (input.eventIds !== undefined) {
        await tx
          .delete(projectEvents)
          .where(eq(projectEvents.projectId, projectId));

        if (input.eventIds.length > 0) {
          await tx
            .insert(projectEvents)
            .values(
              input.eventIds.map((eventId) => ({
                projectId,
                eventId,
              })),
            )
            .onConflictDoNothing();
        }
      }

      if (input.tags !== undefined) {
        await tx
          .delete(projectTags)
          .where(eq(projectTags.projectId, projectId));
        await syncProjectTags(tx, projectId, input.tags, now);
      }

      await syncProjectScreenshots(tx, projectId, nextImageUrls, now);
    });
  } catch (error) {
    await cleanupUnreferencedProjectScreenshotFiles([
      ...stagedImageUrls,
      ...uploadedImageUrls,
    ]);
    throw error;
  }

  await deleteProjectScreenshotFiles(removedImageUrls);

  return getProjectViewById(projectId);
}
