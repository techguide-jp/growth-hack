import { and, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { getDb } from "$lib/server/db";
import {
  projectEvents,
  projectMembers,
  projectScreenshots,
  projectTags,
  projects,
  tags,
  users,
} from "$lib/server/db/schema";
import type {
  CreateProjectInput,
  ProjectHelpType,
  ProjectStage,
  ProjectStatus,
  UpdateProjectInput,
} from "$lib/shared/domain";

type ListProjectsOptions = {
  ownerUserId?: string;
  statuses?: ProjectStatus[];
  search?: string;
  limit?: number;
};

export type ProjectView = {
  id: string;
  ownerId: string;
  ownerName: string | null;
  ownerAvatarUrl: string | null;
  title: string;
  oneLiner: string;
  problemStatement: string;
  projectStage: ProjectStage | null;
  helpTypes: ProjectHelpType[];
  helpRequest: string;
  highlights: string[];
  nextMilestone: string;
  feedbackRequest: string;
  backgroundNote: string;
  publicUrl?: string;
  repoUrl?: string;
  demoUrl?: string;
  tags: string[];
  images: string[];
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
};

function toProjectView(
  project: typeof projects.$inferSelect,
  owner: typeof users.$inferSelect | undefined,
  tagNames: string[],
  imageUrls: string[],
): ProjectView {
  return {
    id: project.id,
    ownerId: project.ownerUserId,
    ownerName: owner?.displayName ?? null,
    ownerAvatarUrl: owner?.avatarUrl ?? null,
    title: project.title,
    oneLiner: project.summary,
    problemStatement: project.problemStatement,
    projectStage: project.projectStage,
    helpTypes: project.helpTypes,
    helpRequest: project.helpRequest,
    highlights: project.highlights,
    nextMilestone: project.nextMilestone,
    feedbackRequest: project.feedbackRequest,
    backgroundNote: project.description,
    publicUrl: project.publicUrl ?? undefined,
    repoUrl: project.repoUrl ?? undefined,
    demoUrl: project.demoUrl ?? undefined,
    tags: tagNames,
    images: imageUrls,
    status: project.status,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

async function enrichProjects(projectRows: typeof projects.$inferSelect[]) {
  if (projectRows.length === 0) {
    return [];
  }

  const db = getDb();
  const projectIds = projectRows.map((project) => project.id);
  const ownerIds = [...new Set(projectRows.map((project) => project.ownerUserId))];

  const [ownerRows, tagRows, screenshotRows] = await Promise.all([
    db.select().from(users).where(inArray(users.id, ownerIds)),
    db
      .select({
        projectId: projectTags.projectId,
        name: tags.name,
      })
      .from(projectTags)
      .innerJoin(tags, eq(projectTags.tagId, tags.id))
      .where(inArray(projectTags.projectId, projectIds)),
    db
      .select({
        projectId: projectScreenshots.projectId,
        imageUrl: projectScreenshots.imageUrl,
      })
      .from(projectScreenshots)
      .where(inArray(projectScreenshots.projectId, projectIds))
      .orderBy(projectScreenshots.sortOrder, projectScreenshots.createdAt),
  ]);

  const ownerMap = new Map(ownerRows.map((owner) => [owner.id, owner]));
  const tagsByProject = new Map<string, string[]>();
  const imagesByProject = new Map<string, string[]>();

  for (const row of tagRows) {
    const current = tagsByProject.get(row.projectId) ?? [];
    current.push(row.name);
    tagsByProject.set(row.projectId, current);
  }

  for (const row of screenshotRows) {
    const current = imagesByProject.get(row.projectId) ?? [];
    current.push(row.imageUrl);
    imagesByProject.set(row.projectId, current);
  }

  return projectRows.map((project) =>
    toProjectView(
      project,
      ownerMap.get(project.ownerUserId),
      tagsByProject.get(project.id) ?? [],
      imagesByProject.get(project.id) ?? [],
    ),
  );
}

export async function getProjectById(projectId: string) {
  const db = getDb();
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  return project ?? null;
}

export async function getProjectViewById(projectId: string) {
  const project = await getProjectById(projectId);

  if (!project) {
    return null;
  }

  const [view] = await enrichProjects([project]);
  return view ?? null;
}

export async function listProjects(options: ListProjectsOptions = {}) {
  const db = getDb();
  const conditions = [];

  if (options.ownerUserId) {
    conditions.push(eq(projects.ownerUserId, options.ownerUserId));
  }

  if (options.statuses && options.statuses.length > 0) {
    conditions.push(inArray(projects.status, options.statuses));
  }

  if (options.search) {
    const query = `%${options.search.trim()}%`;
    conditions.push(
      or(
        ilike(projects.title, query),
        ilike(projects.summary, query),
        ilike(projects.problemStatement, query),
        ilike(projects.helpRequest, query),
      ),
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  if (whereClause) {
    const rows = await db
      .select()
      .from(projects)
      .where(whereClause)
      .orderBy(desc(projects.updatedAt))
      .limit(options.limit ?? Number.MAX_SAFE_INTEGER);

    return enrichProjects(rows);
  }

  const rows = await db
    .select()
    .from(projects)
    .orderBy(desc(projects.updatedAt))
    .limit(options.limit ?? Number.MAX_SAFE_INTEGER);

  return enrichProjects(rows);
}

export async function createProject(
  ownerUserId: string,
  input: CreateProjectInput,
) {
  const db = getDb();
  const projectId = crypto.randomUUID();
  const now = new Date();

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
  });

  return getProjectViewById(projectId);
}

export async function updateProject(
  projectId: string,
  input: UpdateProjectInput,
) {
  const db = getDb();
  const now = new Date();
  const updateValues: Partial<typeof projects.$inferInsert> = {
    updatedAt: now,
  };

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

  await db.transaction(async (tx) => {
    await tx.update(projects).set(updateValues).where(eq(projects.id, projectId));

    if (input.eventIds !== undefined) {
      await tx.delete(projectEvents).where(eq(projectEvents.projectId, projectId));

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
      await tx.delete(projectTags).where(eq(projectTags.projectId, projectId));
      await syncProjectTags(tx, projectId, input.tags, now);
    }
  });

  return getProjectViewById(projectId);
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

  const persistedTags = await tx.select().from(tags).where(inArray(tags.name, names));

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

export async function listProjectMembers(projectId: string) {
  const db = getDb();

  return db
    .select()
    .from(projectMembers)
    .where(eq(projectMembers.projectId, projectId));
}

export async function isProjectOwner(projectId: string, userId: string) {
  const project = await getProjectById(projectId);
  return project?.ownerUserId === userId;
}

export async function isProjectMember(projectId: string, userId: string) {
  if (await isProjectOwner(projectId, userId)) {
    return true;
  }

  const db = getDb();
  const [member] = await db
    .select({ userId: projectMembers.userId })
    .from(projectMembers)
    .where(
      and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId),
      ),
    )
    .limit(1);

  return Boolean(member);
}
