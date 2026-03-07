# DB設計（PostgreSQL想定）

## 1. ユーザ

### users

- id (PK)
- email (unique)
- display_name
- avatar_url
- role (user/admin)
- created_at

### user_preferences

- user_id (PK/FK users.id)
- focus_modes (jsonb) 例: `["post","support","collab","event"]`
- default_landing
- updated_at

### notification_settings

- user_id (PK/FK)
- rules (jsonb)
  - 種類×チャネル×（将来 frequency）
- updated_at

### user_presence

- user_id (PK/FK)
- last_seen_at
- status_text (nullable)
- now_project_id (nullable)

---

## 2. イベント/告知

### events

- id (PK)
- title
- description
- start_at
- end_at
- status (draft/published)
- created_by_user_id (FK users.id)
- approved_by_admin_id (nullable)
- approved_at (nullable)
- created_at
- updated_at

### announcements

- id (PK)
- title
- body
- target_type (all/event)
- event_id (nullable)
- published_at
- created_by_user_id

---

## 3. プロジェクト

### projects

- id (PK)
- owner_user_id (FK users.id)
- title
- summary
- description
- public_url
- repo_url
- demo_url
- status (draft/published/archived)
- created_at
- updated_at

### project_events

- project_id (FK)
- event_id (FK)
- PK (project_id, event_id)

### project_members

- project_id (FK)
- user_id (FK)
- member_role (owner/contributor)
- joined_at
- PK (project_id, user_id)

### tags

- id (PK)
- name (unique)

### project_tags

- project_id
- tag_id
- PK (project_id, tag_id)

### project_screenshots

- id (PK)
- project_id
- image_url
- sort_order

### updates

- id (PK)
- project_id
- author_user_id
- title
- body
- published_at

---

## 4. コミュニティ

### comments

- id (PK)
- target_type (project/update/timeline_post)
- target_id
- author_user_id
- body
- created_at

### reviews

- id (PK)
- project_id
- author_user_id
- rating (1-5)
- body
- created_at

### reactions

- id (PK)
- target_type (project/update/timeline_post/comment)
- target_id
- user_id
- kind (clap/like/idea/fire/help)
- created_at
- UNIQUE (target_type, target_id, user_id, kind)

### follows

- follower_user_id
- target_type (user/project)
- target_id
- created_at
- UNIQUE (follower_user_id, target_type, target_id)

---

## 5. 支援

### support_links

- id (PK)
- project_id
- kind
- url
- created_at

### support_records

- id (PK)
- project_id
- supporter_user_id
- amount_jpy (integer)
- message (nullable)
- external_reference (nullable)
- status (awaiting_owner/confirmed/cancelled/rejected)
- owner_confirmed_at (nullable)
- created_at
- updated_at

---

## 6. 仲間募集

### help_wanted

- id (PK)
- project_id
- title
- detail
- skills (jsonb)
- status (open/closed)
- created_at

### join_requests

- id (PK)
- project_id
- applicant_user_id
- message
- status (pending/approved/rejected)
- created_at

---

## 7. メッセージ

### conversations

- id (PK)
- type (direct/project)
- project_id (nullable)
- created_at

### conversation_members

- conversation_id
- user_id
- joined_at
- PK (conversation_id, user_id)

### messages

- id (PK)
- conversation_id
- sender_user_id
- body
- created_at

### message_reads

- conversation_id
- user_id
- last_read_at
- last_read_message_id (nullable)
- PK (conversation_id, user_id)

---

## 8. タイムライン/アクティビティ

### timeline_posts

- id (PK)
- author_user_id
- type (progress/question/showcase)
- title (nullable)
- body (nullable)
- project_id (nullable)
- event_id (nullable)
- visibility (public)
- status (open/solved) # questionのみ利用
- accepted_comment_id (nullable)
- question_meta (jsonb, nullable)
  - `{ situation, problem, tried, environment }`
- is_hidden (boolean, default false) # 将来の安全弁
- created_at
- updated_at

### activity_events

- id (PK)
- type
- actor_user_id
- project_id (nullable)
- event_id (nullable)
- target_type
- target_id
- payload (jsonb)
- created_at

---

## 9. 通知

### notifications

- id (PK)
- user_id
- type
- payload (jsonb)
- read_at (nullable)
- created_at

### email_outbox

- id (PK)
- to_email
- template_id
- payload (jsonb)
- status (queued/sent/failed)
- created_at
- sent_at (nullable)

---

## 10. 監査ログ

### audit_logs

- id (PK)
- actor_user_id
- action
- target_type
- target_id
- metadata (jsonb)
- created_at
