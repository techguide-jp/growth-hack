# API設計（REST例）

> SvelteKit想定: `/src/routes/api/**/+server.ts` で実装しやすい粒度

## 1. 認証/ユーザ
- `GET /api/me`
- `GET /api/me/preferences`
- `PUT /api/me/preferences`
- `GET /api/me/notification-settings`
- `PUT /api/me/notification-settings`

## 2. イベント/告知
- `GET /api/events`
- `GET /api/events/:eventId`
- `POST /api/admin/events`
- `PATCH /api/admin/events/:eventId`
- `POST /api/admin/announcements`
- `GET /api/announcements?eventId=`

## 3. プロジェクト
- `POST /api/projects`
- `PATCH /api/projects/:projectId`
- `POST /api/projects/:projectId/publish`
- `GET /api/projects?eventId=&tag=&q=&sort=updated_desc|new_desc|support_desc|cheer_desc|review_desc`
- `GET /api/projects/:projectId`

### 画像アップロード（スクショ）
- `POST /api/uploads/signed-url`（署名URL発行）
  - フロント→ストレージへ直接アップロード→DB登録
- `POST /api/projects/:projectId/screenshots`
- `DELETE /api/projects/:projectId/screenshots/:id`

## 4. 更新投稿（リリースノート）
- `POST /api/projects/:projectId/updates`
- `GET /api/projects/:projectId/updates`

## 5. コメント（汎用）
- `POST /api/comments`
  - body: `{ targetType, targetId, body }`
- `GET /api/comments?targetType=&targetId=`

## 6. レビュー
- `POST /api/projects/:projectId/reviews`
- `GET /api/projects/:projectId/reviews`

## 7. リアクション（5種）
- `POST /api/reactions`
  - body: `{ targetType, targetId, kind }`
- `DELETE /api/reactions`
  - body: `{ targetType, targetId, kind }`

## 8. フォロー
- `POST /api/follows`
- `DELETE /api/follows`

## 9. 支援
### 外部支援リンク
- `POST /api/projects/:projectId/support-links`
- `GET /api/projects/:projectId/support-links`

### 支援記録
- `POST /api/projects/:projectId/support-records`
  - 支援者が作成 → `awaiting_owner`
- `POST /api/support-records/:recordId/owner-confirm`
  - 受領側が確定 → `confirmed`
- `POST /api/support-records/:recordId/cancel`
  - 支援者のみ（確定前）
- `POST /api/support-records/:recordId/reject`
  - オーナーのみ（確定前）
- `GET /api/me/support-records?type=supported|received`

## 10. 仲間募集/参加申請
- `POST /api/projects/:projectId/help-wanted`
- `PATCH /api/help-wanted/:id`
- `POST /api/projects/:projectId/join-requests`
- `PATCH /api/join-requests/:id`（承認/却下）

## 11. タイムライン
- `GET /api/timeline?scope=global|following|event|project&id=&cursor=`
- `POST /api/timeline`
  - body: `{ type, title?, body?, projectId?, eventId?, questionMeta? }`
- `PATCH /api/timeline/:postId`
- `POST /api/timeline/:postId/solve`
  - body: `{ acceptedCommentId }`

## 12. アクティビティ/プレゼンス
- `GET /api/activity?scope=global|following&cursor=`
- `POST /api/presence/ping`
- `PUT /api/presence`
  - body: `{ statusText?, nowProjectId? }`

## 13. メッセージ
- `GET /api/messages/conversations`
- `POST /api/messages/conversations`
  - body (direct): `{ type: "direct", userId }`
  - body (project): `{ type: "project", projectId }`
- `GET /api/messages/conversations/:id/messages?cursor=`
- `POST /api/messages/conversations/:id/messages`
- `POST /api/messages/conversations/:id/read`

## 14. 通知
- `GET /api/notifications`
- `POST /api/notifications/:id/read`
