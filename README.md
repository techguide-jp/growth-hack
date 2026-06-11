# Growth Hach

ハッカソンで生まれた作品の継続開発を後押しするコミュニティサービスです。作品の発見、進捗共有、相談、リアクション、DM、プロジェクト会話、支援記録をまとめて扱います。

## 概要

Growth Hach は、発表後に止まりがちな個人・小規模チームの開発を継続しやすくするための SvelteKit アプリです。

- 作品を投稿し、イベント・タグ・更新順で見つけられる
- 進捗、相談、見せびらかしをタイムラインへ投稿できる
- 相談投稿にコメントし、ベスト回答で解決済みにできる
- 5 種類のリアクションで称賛・応援できる
- ユーザ同士の DM とプロジェクト単位の会話を扱える
- 外部支援リンクと、受領側確定型の支援記録を扱える
- 管理者はイベントや告知を管理できる

## 技術スタック

- SvelteKit / Svelte 5 / TypeScript
- Tailwind CSS
- Better Auth
- PostgreSQL / Drizzle ORM / Drizzle Kit
- Vercel Adapter
- Vercel Blob またはローカルファイル保存
- Vitest / svelte-check / ESLint / Prettier

## セットアップ

Node.js 22 系と pnpm を使います。pnpm のバージョンは `packageManager` に固定されています。

```bash
pnpm install
cp .env.example .env
```

`.env` を編集します。ローカル開発では `DATABASE_URL` が空の場合、アプリ側は `postgresql://postgres:postgres@127.0.0.1:5432/growth_hach_dev` を使います。Drizzle コマンドを実行する場合は、接続先を明示するため `DATABASE_URL` を設定してください。

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/growth_hach_dev
BETTER_AUTH_SECRET=十分に長いランダム文字列
BETTER_AUTH_URL=http://localhost:4180
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
ADMIN_EMAILS=
MEDIA_STORAGE_DRIVER=local
BLOB_READ_WRITE_TOKEN=
VERCEL_BLOB_CALLBACK_URL=
```

DB を用意して、マイグレーションと seed を流します。

```bash
pnpm db:migrate
pnpm db:seed
```

ローカル DB を初期化し直す場合のみ、次のコマンドを使います。`public` / `drizzle` schema を削除するため、必要なデータがないことを確認してください。

```bash
pnpm db:reset:migrate
pnpm db:seed
```

## 開発

```bash
pnpm dev
```

開発サーバは空いている `127.0.0.1:5173` 以降のポートで起動します。認証 callback 用に `http://localhost:4180` のプロキシも同時に起動します。

OAuth provider 側の callback URL は、ローカルでは次を登録してください。

- Google: `http://localhost:4180/api/auth/callback/google`
- GitHub: `http://localhost:4180/api/auth/callback/github`

詳しい OAuth 設定は [docs/09_oauth_setup.md](docs/09_oauth_setup.md) を参照してください。

## よく使うコマンド

| コマンド           | 用途                                |
| ------------------ | ----------------------------------- |
| `pnpm dev`         | Vite 開発サーバと認証プロキシを起動 |
| `pnpm build`       | production build                    |
| `pnpm preview`     | build 結果をローカル preview        |
| `pnpm check`       | SvelteKit sync と svelte-check      |
| `pnpm lint`        | check、ESLint、Prettier check       |
| `pnpm test`        | Vitest                              |
| `pnpm format`      | Prettier で整形                     |
| `pnpm qa`          | lint、build、audit                  |
| `pnpm db:generate` | Drizzle migration 生成              |
| `pnpm db:migrate`  | migration 適用                      |
| `pnpm db:seed`     | サンプルデータ投入                  |
| `pnpm db:status`   | DB 状態確認                         |
| `pnpm db:query`    | SQL 実行補助                        |

本番相当の DB 操作には `:prod` 付き script を使います。これらは `APP_ENV=production` で `.env.production` を読みます。

## 画像保存

プロジェクトのスクリーンショットは、環境に応じて保存先を切り替えます。

- `MEDIA_STORAGE_DRIVER=local`: `static/media/**` 配下へ保存
- `MEDIA_STORAGE_DRIVER=vercel-blob`: Vercel Blob へ保存
- `MEDIA_STORAGE_DRIVER` 未設定時は、`BLOB_READ_WRITE_TOKEN` があれば Vercel Blob、なければ local

Vercel など serverless bundle filesystem では local 保存を使えないため、`MEDIA_STORAGE_DRIVER=vercel-blob` と `BLOB_READ_WRITE_TOKEN` を設定してください。

## 主要ディレクトリ

```text
src/routes/                 SvelteKit routes と API endpoints
src/lib/components/         共有 UI components
src/lib/stores/             client-side stores
src/lib/shared/             client/server 共有の型・定数・純粋関数
src/lib/server/             server-only の DB・repository・auth・media 処理
drizzle/migrations/         Drizzle migrations
scripts/                    開発・DB・build 補助 script
static/                     public assets
docs/                       仕様・API・DB・画面・OAuth などの設計資料
```

## 主要ルート

- `/`: ホーム
- `/timeline`: タイムライン
- `/events`, `/events/[id]`: イベント一覧・詳細
- `/projects`, `/projects/new`, `/projects/[id]`, `/projects/[id]/edit`: プロジェクト一覧・作成・詳細・編集
- `/users/[id]`: ユーザページ
- `/onboarding`: 初回フォーカス選択
- `/dashboard`: ダッシュボード
- `/messages`, `/messages/[id]`: 会話一覧・会話スレッド
- `/settings`: 設定
- `/admin`: 管理画面
- `/api/**`: API endpoints

## ドキュメント

- [docs/01_spec.md](docs/01_spec.md): 仕様書
- [docs/02_api_design.md](docs/02_api_design.md): API 設計
- [docs/03_db_design.md](docs/03_db_design.md): DB 設計
- [docs/04_screen_design.md](docs/04_screen_design.md): 画面設計
- [docs/05_component_design.md](docs/05_component_design.md): component 設計
- [docs/09_oauth_setup.md](docs/09_oauth_setup.md): OAuth 設定手順
- [docs/10\_画像機能移設ガイド.md](docs/10_画像機能移設ガイド.md): 画像機能の移設ガイド
- [docs/17\_本プロジェクト画像実装.md](docs/17_本プロジェクト画像実装.md): 本プロジェクトの画像実装メモ

## 開発時の注意

- `.svelte` は Svelte 5 rune syntax を優先します。
- 認証 callback は `5173` ではなく `4180` を使います。
- `db:reset` 系は schema を削除します。共有 DB や本番相当環境では使わないでください。
- production では `DATABASE_URL` と `BETTER_AUTH_SECRET` を必ず設定してください。
- Vercel へ出す場合は `pnpm vercel:build` が build script として用意されています。
