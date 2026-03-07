import { json } from "@sveltejs/kit";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { z } from "zod";
import { requireOnboarded } from "$lib/server/auth/guards";
import { getMediaStorageDriver } from "$lib/server/media/storage";
import {
  parseProjectScreenshotPathname,
  PROJECT_SCREENSHOT_MAX_SOURCE_SIZE_BYTES,
  PROJECT_SCREENSHOT_OUTPUT_MIME_TYPE,
  PROJECT_SCREENSHOT_SCOPE,
} from "$lib/shared/media/config";

const clientPayloadSchema = z.object({
  scope: z.literal(PROJECT_SCREENSHOT_SCOPE),
  userId: z.string().trim().min(1),
  projectId: z.string().trim().min(1),
});

export async function POST(event: import("./$types").RequestEvent) {
  if (getMediaStorageDriver() !== "vercel-blob") {
    return json(
      { message: "この環境では直アップロードを利用できません。" },
      { status: 400 },
    );
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    return json(
      { message: "BLOB_READ_WRITE_TOKEN が設定されていません。" },
      { status: 500 },
    );
  }

  const body = (await event.request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request: event.request,
      token,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const user = requireOnboarded(event);
        const parsedPath = parseProjectScreenshotPathname(pathname);
        const payload = clientPayloadSchema.safeParse(
          clientPayload ? JSON.parse(clientPayload) : null,
        );

        if (!parsedPath || !payload.success) {
          throw new Error("アップロード情報が不正です。");
        }

        if (
          payload.data.userId !== user.id ||
          parsedPath.userId !== user.id ||
          payload.data.projectId !== parsedPath.projectId
        ) {
          throw new Error(
            "アップロード先の所有者またはプロジェクトが一致しません。",
          );
        }

        return {
          addRandomSuffix: false,
          allowedContentTypes: [PROJECT_SCREENSHOT_OUTPUT_MIME_TYPE],
          callbackUrl: process.env.VERCEL_BLOB_CALLBACK_URL,
          maximumSizeInBytes: PROJECT_SCREENSHOT_MAX_SOURCE_SIZE_BYTES,
          tokenPayload: clientPayload,
        };
      },
    });

    return json(result);
  } catch (error) {
    return json(
      {
        message:
          error instanceof Error
            ? error.message
            : "画像アップロードの初期化に失敗しました。",
      },
      { status: 400 },
    );
  }
}
