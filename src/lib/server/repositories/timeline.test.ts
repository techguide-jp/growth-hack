import { describe, expect, it } from "vitest";
import {
  buildReactionSummary,
  isTimelinePostIncludedInFollowingFeed,
  selectTimelineCommentPreview,
  validateTimelineSolveRequest,
} from "$lib/server/repositories/timeline";
import {
  createCommentInputSchema,
  toggleReactionInputSchema,
} from "$lib/shared/domain";

describe("timeline repository helpers", () => {
  it("リアクション集計で件数と自分の状態を返す", () => {
    expect(
      buildReactionSummary(
        [
          { kind: "clap", userId: "u1" },
          { kind: "clap", userId: "u2" },
          { kind: "fire", userId: "u3" },
        ],
        "u2",
      ),
    ).toEqual([
      { kind: "clap", count: 2, reactedByMe: true },
      { kind: "like", count: 0, reactedByMe: false },
      { kind: "idea", count: 0, reactedByMe: false },
      { kind: "fire", count: 1, reactedByMe: false },
      { kind: "help", count: 0, reactedByMe: false },
    ]);
  });

  it("コメント preview は末尾3件を返す", () => {
    expect(
      selectTimelineCommentPreview([
        {
          id: "c1",
          targetId: "tp1",
          targetType: "timeline_post",
          body: "first",
          createdAt: "2026-01-01T00:00:00.000Z",
          author: {
            id: "u1",
            displayName: "Alice",
            avatarUrl: null,
          },
          isAccepted: false,
        },
        {
          id: "c2",
          targetId: "tp1",
          targetType: "timeline_post",
          body: "second",
          createdAt: "2026-01-01T00:01:00.000Z",
          author: {
            id: "u2",
            displayName: "Bob",
            avatarUrl: null,
          },
          isAccepted: false,
        },
        {
          id: "c3",
          targetId: "tp1",
          targetType: "timeline_post",
          body: "third",
          createdAt: "2026-01-01T00:02:00.000Z",
          author: {
            id: "u3",
            displayName: "Carol",
            avatarUrl: null,
          },
          isAccepted: false,
        },
        {
          id: "c4",
          targetId: "tp1",
          targetType: "timeline_post",
          body: "fourth",
          createdAt: "2026-01-01T00:03:00.000Z",
          author: {
            id: "u4",
            displayName: "Dave",
            avatarUrl: null,
          },
          isAccepted: false,
        },
      ]).map((comment) => comment.id),
    ).toEqual(["c2", "c3", "c4"]);
  });

  it("following feed はフォロー中ユーザーかフォロー中プロジェクト投稿を含める", () => {
    expect(
      isTimelinePostIncludedInFollowingFeed(
        {
          authorUserId: "u1",
          projectId: null,
        },
        ["u1"],
        [],
      ),
    ).toBe(true);

    expect(
      isTimelinePostIncludedInFollowingFeed(
        {
          authorUserId: "u9",
          projectId: "p1",
        },
        [],
        ["p1"],
      ),
    ).toBe(true);

    expect(
      isTimelinePostIncludedInFollowingFeed(
        {
          authorUserId: "u9",
          projectId: "p9",
        },
        ["u1"],
        ["p1"],
      ),
    ).toBe(false);
  });

  it("相談解決の検証は本人・質問投稿・関連コメントを要求する", () => {
    expect(
      validateTimelineSolveRequest({
        acceptedComment: {
          id: "c1",
          targetId: "tp1",
          targetType: "timeline_post",
        },
        post: {
          id: "tp1",
          authorUserId: "u1",
          type: "progress",
        },
        viewerUserId: "u1",
      }),
    ).toEqual({
      ok: false,
      message: "相談投稿のみ解決済みにできます。",
      status: 400,
    });

    expect(
      validateTimelineSolveRequest({
        acceptedComment: {
          id: "c1",
          targetId: "tp1",
          targetType: "timeline_post",
        },
        post: {
          id: "tp1",
          authorUserId: "u1",
          type: "question",
        },
        viewerUserId: "u2",
      }),
    ).toEqual({
      ok: false,
      message: "投稿者本人のみ解決済みにできます。",
      status: 403,
    });

    expect(
      validateTimelineSolveRequest({
        acceptedComment: {
          id: "c2",
          targetId: "tp9",
          targetType: "timeline_post",
        },
        post: {
          id: "tp1",
          authorUserId: "u1",
          type: "question",
        },
        viewerUserId: "u1",
      }),
    ).toEqual({
      ok: false,
      message: "指定したコメントはこの相談投稿に紐づいていません。",
      status: 400,
    });

    expect(
      validateTimelineSolveRequest({
        acceptedComment: {
          id: "c1",
          targetId: "tp1",
          targetType: "timeline_post",
        },
        post: {
          id: "tp1",
          authorUserId: "u1",
          type: "question",
        },
        viewerUserId: "u1",
      }),
    ).toEqual({ ok: true });
  });

  it("コメント payload は timeline_post / project / update のみ許可する", () => {
    expect(
      createCommentInputSchema.safeParse({
        targetType: "timeline_post",
        targetId: "tp1",
        body: "hello",
      }).success,
    ).toBe(true);

    expect(
      createCommentInputSchema.safeParse({
        targetType: "comment",
        targetId: "c1",
        body: "hello",
      }).success,
    ).toBe(false);
  });

  it("リアクション payload は定義済み kind のみ許可する", () => {
    expect(
      toggleReactionInputSchema.safeParse({
        targetType: "timeline_post",
        targetId: "tp1",
        kind: "fire",
      }).success,
    ).toBe(true);

    expect(
      toggleReactionInputSchema.safeParse({
        targetType: "timeline_post",
        targetId: "tp1",
        kind: "rocket",
      }).success,
    ).toBe(false);
  });
});
