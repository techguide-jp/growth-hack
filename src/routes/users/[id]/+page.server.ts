import { and, eq, inArray } from "drizzle-orm";
import type { PageServerLoad } from "./$types";
import { getUserPreferencesState } from "$lib/server/account-settings";
import { getDb } from "$lib/server/db";
import { supportRecords, users } from "$lib/server/db/schema";
import { listProjects } from "$lib/server/repositories/projects";
import { listTimelinePosts } from "$lib/server/repositories/timeline";
import { TIMELINE_INVALIDATION_KEY } from "$lib/shared/timeline";

export const load: PageServerLoad = async (event) => {
  event.depends(TIMELINE_INVALIDATION_KEY);

  const userId = event.params.id;
  const db = getDb();
  const [profileRecord] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!profileRecord) {
    return {
      profile: null,
      userProjects: [],
      recentPosts: [],
      focusModes: [],
      totalConfirmedSupport: 0,
    };
  }

  const isOwnProfile = event.locals.user?.id === userId;
  const [preferences, userProjects, recentPosts] = await Promise.all([
    getUserPreferencesState(userId),
    listProjects({
      ownerUserId: userId,
      statuses: isOwnProfile ? undefined : ["published"],
    }),
    listTimelinePosts({
      authorUserId: userId,
      viewerUserId: event.locals.user?.id,
      limit: 5,
    }),
  ]);

  const projectIds = userProjects.map((project) => project.id);
  const confirmedSupportRows =
    projectIds.length > 0
      ? await db
          .select({
            amountJpy: supportRecords.amountJpy,
          })
          .from(supportRecords)
          .where(
            and(
              inArray(supportRecords.projectId, projectIds),
              eq(supportRecords.status, "confirmed"),
            ),
          )
      : [];

  const totalConfirmedSupport = confirmedSupportRows.reduce(
    (sum, record) => sum + record.amountJpy,
    0,
  );

  return {
    profile: profileRecord,
    userProjects,
    recentPosts,
    focusModes: preferences.focusModes,
    totalConfirmedSupport,
  };
};
