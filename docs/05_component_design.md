# コンポーネント設計（SvelteKit）

## 1. ページ構成（SvelteKit）

- `/src/routes/+layout.svelte`（グローバルレイアウト）
- `/src/routes/+page.svelte`（ホーム）
- `/src/routes/timeline/+page.svelte`
- `/src/routes/projects/+page.svelte`（一覧）
- `/src/routes/projects/[id]/+page.svelte`（詳細）
- `/src/routes/messages/+page.svelte`（会話一覧）
- `/src/routes/messages/[id]/+page.svelte`（スレッド）
- `/src/routes/settings/+page.svelte`
- `/src/routes/admin/+page.svelte`

## 2. 主要UIコンポーネント

### 2.1 タイムライン

- `TimelineComposer.svelte`
  - type切替（進捗/相談/見せびらかし）
  - 相談テンプレ入力（固定）
- `TimelinePostCard.svelte`
  - 投稿表示、関連プロジェクト/イベント表示
- `SolvePanel.svelte`
  - ベスト回答選択、解決済み表示
- `ReactionBar.svelte`
  - 5種類リアクション
- `CommentList.svelte` / `CommentForm.svelte`

### 2.2 プロジェクト

- `ProjectCard.svelte`（一覧カード）
- `ProjectTabs.svelte`
- `ProjectMeta.svelte`（URL/Repo/タグ/メンバー）
- `ScreenshotGallery.svelte`
- `UpdateTimeline.svelte` / `UpdateEditor.svelte`
- `ReviewSummary.svelte` / `ReviewForm.svelte`

### 2.3 支援

- `SupportLinks.svelte`
- `SupportRecordCreateForm.svelte`
- `SupportRecordList.svelte`
- `SupportSummary.svelte`
- `OwnerConfirmButton.svelte`

### 2.4 仲間

- `HelpWantedList.svelte` / `HelpWantedForm.svelte`
- `JoinRequestForm.svelte` / `JoinRequestPanel.svelte`

### 2.5 メッセージ

- `ConversationList.svelte`
- `MessageThread.svelte`
- `MessageComposer.svelte`
- `UnreadBadge.svelte`

### 2.6 通知/設定

- `NotificationBell.svelte`
- `NotificationList.svelte`
- `NotificationSettingsForm.svelte`
- `FocusSettingsForm.svelte`

## 3. ストア/状態管理（例）

- `src/lib/stores/session.ts`（ログイン状態）
- `src/lib/stores/preferences.ts`（フォーカス設定）
- `src/lib/stores/notifications.ts`
- `src/lib/stores/messages.ts`

## 4. 実装上の注意

- フォーカスUIは「表示/並び替え」だけに留め、機能制限はしない
- コメント/リアクションは target_type を共通化して拡張しやすくする
- メッセージは参加者チェックを必ずサーバ側で行う
