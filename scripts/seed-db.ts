import { createDatabaseHandle } from "./lib/database.ts";
import * as schema from "../src/lib/server/db/schema.ts";
import { DEFAULT_NOTIFICATION_SETTINGS } from "../src/lib/shared/settings.ts";

const now = Date.now();

const users = [
  {
    id: "u1",
    email: "yuta@example.com",
    displayName: "YutaDEV",
    avatarUrl: "https://i.pravatar.cc/150?u=u1",
    role: "admin" as const,
    emailVerified: true,
    createdAt: new Date(now - 1000 * 60 * 60 * 24 * 14),
    updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 2),
  },
  {
    id: "u2",
    email: "alice@example.com",
    displayName: "Alice",
    avatarUrl: "https://i.pravatar.cc/150?u=u2",
    role: "user" as const,
    emailVerified: true,
    createdAt: new Date(now - 1000 * 60 * 60 * 24 * 10),
    updatedAt: new Date(now - 1000 * 60 * 60 * 24),
  },
  {
    id: "u3",
    email: "bob@example.com",
    displayName: "Bob",
    avatarUrl: "https://i.pravatar.cc/150?u=u3",
    role: "user" as const,
    emailVerified: true,
    createdAt: new Date(now - 1000 * 60 * 60 * 24 * 8),
    updatedAt: new Date(now - 1000 * 60 * 60 * 12),
  },
];

async function seedDb() {
  const { db, close } = createDatabaseHandle();

  try {
    await db.transaction(async (tx) => {
      await tx.insert(schema.users).values(users).onConflictDoNothing();

      await tx
        .insert(schema.userPreferences)
        .values([
          {
            userId: "u1",
            focusModes: ["post", "collab"],
            defaultLanding: "post",
            onboardingCompletedAt: new Date(now - 1000 * 60 * 60 * 24 * 13),
            createdAt: new Date(now - 1000 * 60 * 60 * 24 * 13),
            updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 2),
          },
          {
            userId: "u2",
            focusModes: ["support", "event"],
            defaultLanding: "support",
            onboardingCompletedAt: new Date(now - 1000 * 60 * 60 * 24 * 9),
            createdAt: new Date(now - 1000 * 60 * 60 * 24 * 9),
            updatedAt: new Date(now - 1000 * 60 * 60 * 24),
          },
          {
            userId: "u3",
            focusModes: ["post", "support"],
            defaultLanding: "post",
            onboardingCompletedAt: new Date(now - 1000 * 60 * 60 * 24 * 7),
            createdAt: new Date(now - 1000 * 60 * 60 * 24 * 7),
            updatedAt: new Date(now - 1000 * 60 * 60 * 12),
          },
        ])
        .onConflictDoNothing();

      await tx
        .insert(schema.notificationSettings)
        .values(
          users.map((user) => ({
            userId: user.id,
            rules: DEFAULT_NOTIFICATION_SETTINGS.rules,
            digestFrequency: DEFAULT_NOTIFICATION_SETTINGS.digestFrequency,
            createdAt: new Date(now - 1000 * 60 * 60 * 24 * 7),
            updatedAt: new Date(now - 1000 * 60 * 60 * 12),
          })),
        )
        .onConflictDoNothing();

      await tx
        .insert(schema.events)
        .values([
          {
            id: "ev1",
            title: "Growth Hach Spring Hackathon",
            description:
              "春開催の継続開発ハッカソン。進捗共有と相談投稿を中心にしたイベントです。",
            startAt: new Date(now - 1000 * 60 * 60 * 24 * 3),
            endAt: new Date(now + 1000 * 60 * 60 * 24 * 10),
            status: "published",
            createdByUserId: "u1",
            approvedByAdminId: "u1",
            approvedAt: new Date(now - 1000 * 60 * 60 * 24 * 4),
            createdAt: new Date(now - 1000 * 60 * 60 * 24 * 5),
            updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 2),
          },
        ])
        .onConflictDoNothing();

      await tx
        .insert(schema.announcements)
        .values([
          {
            id: "ann1",
            title: "今週の投稿テーマ",
            body: "開発の詰まりポイントを相談投稿で共有してみましょう。",
            targetType: "all",
            createdByUserId: "u1",
            publishedAt: new Date(now - 1000 * 60 * 60 * 24),
          },
        ])
        .onConflictDoNothing();

      await tx
        .insert(schema.projects)
        .values([
          {
            id: "p1",
            ownerUserId: "u1",
            title: "Growth Hach Platform",
            summary: "ハッカソン作品の継続開発を支援するプラットフォーム",
            problemStatement:
              "ハッカソンで生まれた作品は、発表後に更新の場や助けを求める場がなく、継続開発が止まりがちです。作品の進捗・相談・応援を一か所に集め、続けやすくしたいです。",
            projectStage: "beta",
            helpTypes: ["feedback", "frontend", "growth"],
            helpRequest:
              "プロジェクト詳細まわりの情報設計と、一覧から協力につながる導線を見てほしいです。特に初見で内容が伝わるか、どこで離脱しそうかをフィードバックしてもらえると助かります。",
            highlights: [
              "相談投稿に固定テンプレを入れて、質問しやすくしている",
              "プロジェクト単位で更新・支援・会話をまとめて見られる",
              "公開前チェックで作品紹介の質を揃えられる",
            ],
            nextMilestone:
              "タイムライン投稿とコメントを実データ化して、プロジェクトの活動が自動で見える状態にする",
            feedbackRequest:
              "一覧カードの情報量が多すぎないか、協力したくなる訴求順になっているかを見てほしいです。",
            description:
              "イベント起点で作品の継続開発を支えるコミュニティ基盤。投稿、相談、支援、会話を一か所に集約します。",
            publicUrl: "https://example.com/growth-hach",
            repoUrl: "https://github.com/techguide-jp/growth-hack",
            demoUrl: "https://demo.example.com/growth-hach",
            status: "published",
            createdAt: new Date(now - 1000 * 60 * 60 * 24 * 12),
            updatedAt: new Date(now - 1000 * 60 * 30),
          },
          {
            id: "p2",
            ownerUserId: "u2",
            title: "AI Code Assistant",
            summary: "VSCode extension for AI coding",
            problemStatement:
              "個人開発では、コードレビューや次の一手をその場で相談できず、実装品質とスピードが落ちやすいです。エディタ内で改善観点を返し、迷いを減らしたいです。",
            projectStage: "prototype",
            helpTypes: ["testing", "design"],
            helpRequest:
              "VSCode 拡張の初期体験をテストして、どのタイミングで案内が多すぎるかを見てほしいです。UIの見せ方も相談したいです。",
            highlights: [
              "選択中コードに対してレビュー観点をその場で返せる",
              "会話履歴を残しながら改善提案を比較できる",
            ],
            nextMilestone:
              "会話導線を見直し、初回起動からレビュー実行までを3ステップ以内にする",
            feedbackRequest:
              "レビュー提案の粒度が適切か、初心者にも理解しやすいかを見てほしいです。",
            description:
              "コード補完とレビュー観点の提案を支援する VSCode 拡張。現在は会話導線を強化中です。",
            publicUrl: "https://example.com/ai-code-assistant",
            repoUrl: "https://github.com/example/ai-code-assistant",
            demoUrl: null,
            status: "published",
            createdAt: new Date(now - 1000 * 60 * 60 * 24 * 9),
            updatedAt: new Date(now - 1000 * 60 * 60 * 24),
          },
        ])
        .onConflictDoNothing();

      await tx
        .insert(schema.projectEvents)
        .values([
          { projectId: "p1", eventId: "ev1" },
          { projectId: "p2", eventId: "ev1" },
        ])
        .onConflictDoNothing();

      await tx
        .insert(schema.projectMembers)
        .values([
          {
            projectId: "p1",
            userId: "u1",
            memberRole: "owner",
            joinedAt: new Date(now - 1000 * 60 * 60 * 24 * 12),
          },
          {
            projectId: "p2",
            userId: "u2",
            memberRole: "owner",
            joinedAt: new Date(now - 1000 * 60 * 60 * 24 * 9),
          },
          {
            projectId: "p2",
            userId: "u1",
            memberRole: "contributor",
            joinedAt: new Date(now - 1000 * 60 * 60 * 24 * 2),
          },
        ])
        .onConflictDoNothing();

      await tx
        .insert(schema.tags)
        .values([
          { id: "tag1", name: "SvelteKit", createdAt: new Date(now) },
          { id: "tag2", name: "TypeScript", createdAt: new Date(now) },
          { id: "tag3", name: "AI", createdAt: new Date(now) },
          { id: "tag4", name: "VSCode", createdAt: new Date(now) },
        ])
        .onConflictDoNothing();

      await tx
        .insert(schema.projectTags)
        .values([
          { projectId: "p1", tagId: "tag1" },
          { projectId: "p1", tagId: "tag2" },
          { projectId: "p2", tagId: "tag3" },
          { projectId: "p2", tagId: "tag4" },
        ])
        .onConflictDoNothing();

      await tx
        .insert(schema.projectScreenshots)
        .values([
          {
            id: "ps1",
            projectId: "p1",
            imageUrl: "https://placehold.co/1200x630?text=Growth+Hach",
            sortOrder: 0,
            createdAt: new Date(now - 1000 * 60 * 60 * 24 * 4),
          },
        ])
        .onConflictDoNothing();

      await tx
        .insert(schema.updates)
        .values([
          {
            id: "up1",
            projectId: "p1",
            authorUserId: "u1",
            title: "オンボーディングと設定保存を本実装",
            body: "認証後の初回導線と通知設定の保存を DB ベースに置き換えました。",
            publishedAt: new Date(now - 1000 * 60 * 60 * 6),
            createdAt: new Date(now - 1000 * 60 * 60 * 6),
            updatedAt: new Date(now - 1000 * 60 * 60 * 6),
          },
        ])
        .onConflictDoNothing();

      await tx
        .insert(schema.timelinePosts)
        .values([
          {
            id: "tp1",
            authorUserId: "u1",
            type: "progress",
            title: null,
            body: "モック依存を剥がしながら、SvelteKit 側のサーバ実装を整備中です。",
            projectId: "p1",
            eventId: "ev1",
            visibility: "public",
            status: "open",
            acceptedCommentId: null,
            questionMeta: null,
            isHidden: false,
            createdAt: new Date(now - 1000 * 60 * 60 * 2),
            updatedAt: new Date(now - 1000 * 60 * 60 * 2),
          },
          {
            id: "tp2",
            authorUserId: "u2",
            type: "question",
            title: "Vercel のデプロイエラーを解消したい",
            body: "ビルドログでは型エラーがなく、デプロイ先でだけ失敗しています。",
            projectId: "p2",
            eventId: "ev1",
            visibility: "public",
            status: "open",
            acceptedCommentId: null,
            questionMeta: {
              situation: "main ブランチへ push 後に自動デプロイ",
              problem: "デプロイ先だけ 500 になる",
              tried: "Vercel Logs 確認、node version 固定",
              environment: "Vercel / Node 20 / SvelteKit 2",
            },
            isHidden: false,
            createdAt: new Date(now - 1000 * 60 * 60),
            updatedAt: new Date(now - 1000 * 60 * 60),
          },
          {
            id: "tp3",
            authorUserId: "u1",
            type: "question",
            title: "通知設計をどこから固めるべきか",
            body: "一覧だけ先に作るか、生成ロジックまで一気に進めるかで迷っています。",
            projectId: "p1",
            eventId: null,
            visibility: "public",
            status: "open",
            acceptedCommentId: null,
            questionMeta: {
              situation: "MVP の通知一覧実装前",
              problem: "最小の着手順が決めきれない",
              tried: "仕様書と画面設計の棚卸し",
              environment: "SvelteKit / Drizzle / Better Auth",
            },
            isHidden: false,
            createdAt: new Date(now - 1000 * 60 * 60 * 3),
            updatedAt: new Date(now - 1000 * 60 * 60 * 3),
          },
        ])
        .onConflictDoNothing();

      await tx
        .insert(schema.comments)
        .values([
          {
            id: "c1",
            targetType: "timeline_post",
            targetId: "tp2",
            authorUserId: "u1",
            body: "デプロイ先の環境変数差分も確認すると切り分けしやすいです。",
            createdAt: new Date(now - 1000 * 60 * 45),
            updatedAt: new Date(now - 1000 * 60 * 45),
          },
        ])
        .onConflictDoNothing();

      await tx
        .insert(schema.reviews)
        .values([
          {
            id: "rv1",
            projectId: "p1",
            authorUserId: "u2",
            rating: 5,
            body: "課題設定が明確で、オンボーディング導線も分かりやすいです。",
            createdAt: new Date(now - 1000 * 60 * 60 * 8),
            updatedAt: new Date(now - 1000 * 60 * 60 * 8),
          },
        ])
        .onConflictDoNothing();

      await tx
        .insert(schema.reactions)
        .values([
          {
            id: "r1",
            targetType: "timeline_post",
            targetId: "tp1",
            userId: "u2",
            kind: "fire",
            createdAt: new Date(now - 1000 * 60 * 50),
          },
          {
            id: "r2",
            targetType: "project",
            targetId: "p1",
            userId: "u3",
            kind: "clap",
            createdAt: new Date(now - 1000 * 60 * 60 * 5),
          },
        ])
        .onConflictDoNothing();

      await tx
        .insert(schema.follows)
        .values([{ followerUserId: "u3", targetType: "project", targetId: "p1" }])
        .onConflictDoNothing();

      await tx
        .insert(schema.supportLinks)
        .values([
          {
            id: "sl1",
            projectId: "p1",
            kind: "buymeacoffee",
            url: "https://buymeacoffee.com/growthhach",
            createdAt: new Date(now - 1000 * 60 * 60 * 24),
          },
        ])
        .onConflictDoNothing();

      await tx
        .insert(schema.supportRecords)
        .values([
          {
            id: "sr1",
            projectId: "p1",
            supporterUserId: "u2",
            amountJpy: 3000,
            message: "相談導線がとても良かったです。",
            externalReference: "coffee-001",
            status: "awaiting_owner",
            ownerConfirmedAt: null,
            createdAt: new Date(now - 1000 * 60 * 60 * 4),
            updatedAt: new Date(now - 1000 * 60 * 60 * 4),
          },
        ])
        .onConflictDoNothing();

      await tx
        .insert(schema.helpWanted)
        .values([
          {
            id: "hw1",
            projectId: "p1",
            title: "SvelteKit の UI 改善に協力してくれる人を募集",
            detail: "ダッシュボードと通知一覧の UI を詰めたいです。",
            skills: ["SvelteKit", "UI Design"],
            status: "open",
            createdAt: new Date(now - 1000 * 60 * 60 * 10),
            updatedAt: new Date(now - 1000 * 60 * 60 * 10),
          },
        ])
        .onConflictDoNothing();

      await tx
        .insert(schema.joinRequests)
        .values([
          {
            id: "jr1",
            projectId: "p1",
            applicantUserId: "u3",
            message: "UI 改善と導線設計を手伝いたいです。",
            status: "pending",
            createdAt: new Date(now - 1000 * 60 * 60 * 2),
            updatedAt: new Date(now - 1000 * 60 * 60 * 2),
          },
        ])
        .onConflictDoNothing();

      await tx
        .insert(schema.conversations)
        .values([
          {
            id: "cv1",
            type: "project",
            projectId: "p2",
            createdAt: new Date(now - 1000 * 60 * 60 * 6),
            updatedAt: new Date(now - 1000 * 60 * 30),
          },
          {
            id: "cv2",
            type: "direct",
            projectId: null,
            createdAt: new Date(now - 1000 * 60 * 60 * 24),
            updatedAt: new Date(now - 1000 * 60 * 60 * 3),
          },
        ])
        .onConflictDoNothing();

      await tx
        .insert(schema.conversationMembers)
        .values([
          { conversationId: "cv1", userId: "u1", joinedAt: new Date(now - 1000 * 60 * 60 * 6) },
          { conversationId: "cv1", userId: "u2", joinedAt: new Date(now - 1000 * 60 * 60 * 6) },
          { conversationId: "cv2", userId: "u1", joinedAt: new Date(now - 1000 * 60 * 60 * 24) },
          { conversationId: "cv2", userId: "u3", joinedAt: new Date(now - 1000 * 60 * 60 * 24) },
        ])
        .onConflictDoNothing();

      await tx
        .insert(schema.messages)
        .values([
          {
            id: "m1",
            conversationId: "cv1",
            senderUserId: "u2",
            body: "プロジェクト会話の導線を先に固めましょう。",
            createdAt: new Date(now - 1000 * 60 * 60),
          },
          {
            id: "m2",
            conversationId: "cv1",
            senderUserId: "u1",
            body: "了解です。次は DB と permission helper から進めます。",
            createdAt: new Date(now - 1000 * 60 * 30),
          },
          {
            id: "m3",
            conversationId: "cv2",
            senderUserId: "u3",
            body: "今週どこを作る予定ですか？",
            createdAt: new Date(now - 1000 * 60 * 60 * 3),
          },
        ])
        .onConflictDoNothing();

      await tx
        .insert(schema.messageReads)
        .values([
          {
            conversationId: "cv1",
            userId: "u1",
            lastReadAt: new Date(now - 1000 * 60 * 20),
            lastReadMessageId: "m2",
          },
          {
            conversationId: "cv1",
            userId: "u2",
            lastReadAt: new Date(now - 1000 * 60 * 30),
            lastReadMessageId: "m2",
          },
          {
            conversationId: "cv2",
            userId: "u1",
            lastReadAt: new Date(now - 1000 * 60 * 60 * 5),
            lastReadMessageId: null,
          },
        ])
        .onConflictDoNothing();

      await tx
        .insert(schema.notifications)
        .values([
          {
            id: "n1",
            userId: "u1",
            type: "comment",
            payload: {
              actorUserId: "u2",
              targetType: "timeline_post",
              targetId: "tp1",
              message: "Alice さんが進捗投稿にコメントしました。",
            },
            readAt: null,
            createdAt: new Date(now - 1000 * 60 * 45),
          },
          {
            id: "n2",
            userId: "u1",
            type: "message",
            payload: {
              actorUserId: "u2",
              conversationId: "cv1",
              message: "新しいプロジェクトメッセージがあります。",
            },
            readAt: null,
            createdAt: new Date(now - 1000 * 60 * 30),
          },
        ])
        .onConflictDoNothing();

      await tx
        .insert(schema.emailOutbox)
        .values([
          {
            id: "mail1",
            toEmail: "yuta@example.com",
            templateId: "new-comment",
            payload: {
              actorName: "Alice",
              targetUrl: "/timeline",
            },
            status: "queued",
            createdAt: new Date(now - 1000 * 60 * 40),
            sentAt: null,
          },
        ])
        .onConflictDoNothing();

      await tx
        .insert(schema.activityEvents)
        .values([
          {
            id: "act1",
            type: "timeline_post_created",
            actorUserId: "u1",
            projectId: "p1",
            eventId: "ev1",
            targetType: "timeline_post",
            targetId: "tp1",
            payload: {
              timelinePostId: "tp1",
            },
            createdAt: new Date(now - 1000 * 60 * 60 * 2),
          },
        ])
        .onConflictDoNothing();

      await tx
        .insert(schema.auditLogs)
        .values([
          {
            id: "audit1",
            actorUserId: "u1",
            action: "seed.initialized",
            targetType: "project",
            targetId: "p1",
            metadata: {
              source: "scripts/seed-db.ts",
            },
            createdAt: new Date(now),
          },
        ])
        .onConflictDoNothing();

      await tx
        .insert(schema.userPresence)
        .values([
          {
            userId: "u1",
            lastSeenAt: new Date(now - 1000 * 60 * 5),
            statusText: "DB基盤を実装中",
            nowProjectId: "p1",
            updatedAt: new Date(now - 1000 * 60 * 5),
          },
          {
            userId: "u2",
            lastSeenAt: new Date(now - 1000 * 60 * 15),
            statusText: "デプロイ導線を調査中",
            nowProjectId: "p2",
            updatedAt: new Date(now - 1000 * 60 * 15),
          },
        ])
        .onConflictDoNothing();
    });

    console.log("db seed complete");
  } finally {
    await close();
  }
}

seedDb().catch((error: unknown) => {
  console.error("db seed failed", error);
  process.exit(1);
});
