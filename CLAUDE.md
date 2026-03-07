# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

ハッカソンで生まれた作品の継続開発を後押しするコミュニティサービス。作品の発見・継続の可視化・助け合い・応援機能を提供する。

## 技術スタック

- **フレームワーク**: SvelteKit
- **データベース**: PostgreSQL
- **画像ストレージ**: オブジェクトストレージ（署名URL方式）
- **認証**: OAuth/メール（SSO）

## 主要ライブラリ

| カテゴリ       | ライブラリ                 | 用途                             |
| -------------- | -------------------------- | -------------------------------- |
| ORM            | drizzle-orm, drizzle-kit   | DB操作、マイグレーション         |
| 認証           | lucia                      | セッション管理、OAuth/メール認証 |
| フォーム       | sveltekit-superforms       | サーバーバリデーション統合       |
| バリデーション | zod                        | スキーマ定義、API入力検証        |
| UI             | shadcn-svelte, tailwindcss | コンポーネント、スタイリング     |
| メール         | resend                     | 通知メール送信                   |
| ストレージ     | @aws-sdk/client-s3         | 署名URL生成、画像アップロード    |

## ユーザロール

- `user`: 全ユーザ共通（投稿・応援両方可能）
- `admin`: 運営のみ（イベント/告知管理）

## 主要ドメイン

### タイムライン投稿タイプ

- `progress`: 進捗報告
- `question`: 相談（固定テンプレ：状況/困りごと/試したこと/環境）
- `showcase`: 見せびらかし

### 支援記録ステータス

`awaiting_owner` → `confirmed`（受領確定）/ `cancelled`（支援者取消）/ `rejected`（オーナー却下）

### リアクション種類（5種）

`clap`, `like`, `idea`, `fire`, `help`

## ルーティング構造

```
/                    # ホーム
/timeline            # タイムライン
/events              # イベント一覧
/events/[id]         # イベント詳細
/projects            # プロジェクト一覧
/projects/[id]       # プロジェクト詳細
/users/[id]          # ユーザページ
/onboarding          # フォーカス選択（初回）
/dashboard           # ダッシュボード
/messages            # 会話一覧
/messages/[id]       # 会話スレッド
/settings            # 設定
/admin               # 管理画面
```

## API設計方針

- SvelteKitの `/src/routes/api/**/+server.ts` で実装
- 汎用コメント/リアクションは `targetType` + `targetId` パターンで統一
- 支援記録は確定（confirmed）のみ表示・集計

## DB設計のポイント

- `target_type` + `target_id` パターンで複数エンティティへの関連を表現（comments, reactions, follows）
- `conversations` は `type: direct | project` で個人DM/グループ会話を区別
- 相談投稿の解決は `timeline_posts.status` + `accepted_comment_id` で管理
- 重要操作は `audit_logs` に記録

## 設計ドキュメント

- `docs/01_spec.md`: 仕様書（機能要件/非機能要件）
- `docs/02_api_design.md`: REST API設計
- `docs/03_db_design.md`: PostgreSQLテーブル定義
- `docs/04_screen_design.md`: 画面設計
- `docs/05_component_design.md`: Svelteコンポーネント設計
