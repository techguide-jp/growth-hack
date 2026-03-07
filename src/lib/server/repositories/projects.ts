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
import type { CreateProjectInput, ProjectStatus } from "$lib/shared/domain";

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
  summary: string;
  description: string;
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
    summary: project.summary,
    description: project.description,
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
      or(ilike(projects.title, query), ilike(projects.summary, query)),
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
      summary: input.summary,
      description: input.description,
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

    if (input.tags.length > 0) {
      await tx
        .insert(tags)
        .values(
          input.tags.map((name) => ({
            id: crypto.randomUUID(),
            name,
            createdAt: now,
          })),
        )
        .onConflictDoNothing();

      const persistedTags = await tx
        .select()
        .from(tags)
        .where(inArray(tags.name, input.tags));

      if (persistedTags.length > 0) {
        await tx
          .insert(projectTags)
          .values(
            persistedTags.map((tag) => ({
              projectId,
              tagId: tag.id,
            })),
          )
          .onConflictDoNothing();
      }
    }
  });

  return getProjectViewById(projectId);
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
