import { json } from "@sveltejs/kit";
import { z } from "zod";
import { requireOnboarded } from "$lib/server/auth/guards";
import { cleanupProjectScreenshotFiles } from "$lib/server/projects/screenshots";

const cleanupBodySchema = z.object({
  projectId: z.string().trim().min(1),
  imageUrls: z.array(z.string().trim().min(1)).max(20),
});

export async function POST(event: import("./$types").RequestEvent) {
  const user = requireOnboarded(event);
  const payload = cleanupBodySchema.safeParse(await event.request.json());

  if (!payload.success) {
    return json(
      {
        message:
          payload.error.issues[0]?.message ?? "cleanup の入力が不正です。",
      },
      { status: 400 },
    );
  }

  try {
    await cleanupProjectScreenshotFiles({
      userId: user.id,
      projectId: payload.data.projectId,
      imageUrls: payload.data.imageUrls,
    });

    return json({ ok: true });
  } catch (error) {
    return json(
      {
        message:
          error instanceof Error
            ? error.message
            : "スクリーンショットの cleanup に失敗しました。",
      },
      { status: 400 },
    );
  }
}
