import { eq, inArray } from "drizzle-orm";
import { getDb } from "$lib/server/db";
import { projectScreenshots } from "$lib/server/db/schema";

export async function listReferencedProjectScreenshotUrls(imageUrls: string[]) {
  const uniqueUrls = [
    ...new Set(imageUrls.map((url) => url.trim()).filter(Boolean)),
  ];

  if (uniqueUrls.length === 0) {
    return [];
  }

  const db = getDb();
  const rows = await db
    .select({ imageUrl: projectScreenshots.imageUrl })
    .from(projectScreenshots)
    .where(inArray(projectScreenshots.imageUrl, uniqueUrls));

  return rows.map((row) => row.imageUrl);
}

export async function isProjectScreenshotReferenced(imageUrl: string) {
  const db = getDb();
  const [row] = await db
    .select({ imageUrl: projectScreenshots.imageUrl })
    .from(projectScreenshots)
    .where(eq(projectScreenshots.imageUrl, imageUrl))
    .limit(1);

  return Boolean(row);
}
