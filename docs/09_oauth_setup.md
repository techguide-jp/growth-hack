# OAuth 設定手順（Google / GitHub）

最終確認日: 2026-03-07

## 1. このリポジトリの前提

このリポジトリは Better Auth を使って Google / GitHub ログインを実装しています。

- `baseURL`: `BETTER_AUTH_URL`
- `basePath`: `/api/auth`
- ローカル開発時の認証用 URL: `http://localhost:4180`

実装根拠:

- [src/lib/auth.ts](/Users/yuta/works/TG/growth-hach/src/lib/auth.ts)
- [scripts/dev.mjs](/Users/yuta/works/TG/growth-hach/scripts/dev.mjs)
- [.env.example](/Users/yuta/works/TG/growth-hach/.env.example)

そのため、OAuth プロバイダ側に登録する callback URL は以下になります。

## 2. callback URL 一覧

### 2.1 ローカル開発

- Google: `http://localhost:4180/api/auth/callback/google`
- GitHub: `http://localhost:4180/api/auth/callback/github`

注意:

- 開発サーバ本体は `5173` 以降の空きポートで起動されますが、認証 callback は `4180` に到達するようになっています
- OAuth プロバイダ側には `5173` ではなく `4180` を登録してください

### 2.2 本番

- Google: `https://<本番ドメイン>/api/auth/callback/google`
- GitHub: `https://<本番ドメイン>/api/auth/callback/github`

例:

- `https://growth-hach.example.com/api/auth/callback/google`
- `https://growth-hach.example.com/api/auth/callback/github`

## 3. 環境変数

最低限必要な環境変数は以下です。

```env
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
ADMIN_EMAILS=
```

ローカル例:

```env
BETTER_AUTH_URL=http://localhost:4180
GOOGLE_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxx
GITHUB_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxx
BETTER_AUTH_SECRET=十分に長いランダム文字列
```

`BETTER_AUTH_SECRET` は固定値で運用してください。開発でも毎回変わる値にするとセッションが不安定になります。

生成例:

```bash
openssl rand -base64 32
```

## 4. Google OAuth の設定手順

### 4.1 Google Cloud project を作成

1. [Google Cloud Console](https://console.cloud.google.com/) を開く
2. OAuth 用の project を新規作成する
3. 必要に応じて課金設定や API 有効化の確認を行う

この構成では Google ログインだけが目的なので、まずは OAuth client の作成を優先して問題ありません。

### 4.2 OAuth consent screen を設定

1. Google Cloud Console で `Google Auth platform` を開く
2. `Branding` で以下を入力する
3. `App name`
4. `User support email`
5. `Contact Information`
6. Google API Services User Data Policy に同意して作成する

ユーザ種別の考え方:

- 社内限定の Google Workspace 環境だけで使うなら `Internal`
- 一般ユーザにも使わせるなら `External`

開発段階では通常 `External` になります。

### 4.3 Test users を追加

`External` を選んだ場合、公開前の `Testing` 状態では test user の追加が必要です。

1. `Audience` を開く
2. `Test users` の `Add users` を押す
3. 自分の Google アカウントと、動作確認するメンバーの Google アカウントを追加する

追加していない Google アカウントでは、ログイン確認ができません。

### 4.4 OAuth Client ID を作成

1. `Google Auth platform` または `APIs & Services` から `Credentials` を開く
2. `Create Credentials`
3. `OAuth client ID`
4. Application type は `Web application`
5. `Authorized redirect URIs` に以下を追加する

ローカル:

- `http://localhost:4180/api/auth/callback/google`

本番:

- `https://<本番ドメイン>/api/auth/callback/google`

6. 作成後、`Client ID` と `Client Secret` を控える

### 4.5 Authorized JavaScript origins について

このリポジトリの実装は Better Auth の通常の OAuth リダイレクトフローを使っています。現状コード上は Google JavaScript API を直接使っていないため、`Authorized redirect URIs` が主設定です。

推論:

- `Authorized JavaScript origins` は現在の実装では必須ではありません
- 将来 Google One Tap や Google JS SDK を導入する場合は別途 origin 設定が必要です

### 4.6 Google 側の注意点

- redirect URI は完全一致で判定されます
- `http://` は原則不可ですが、`localhost` は例外として許可されています
- 本番は HTTPS を前提にしてください
- `BETTER_AUTH_URL` と Google 側の redirect URI が一致していないと `redirect_uri_mismatch` になります

### 4.7 本番公開前の確認

公開前に最低限確認すること:

- 本番ドメインで `BETTER_AUTH_URL` を設定している
- 本番 callback URL を Google 側に追加済み
- 公開用のアプリ名、サポートメール、連絡先を設定済み
- 必要に応じてホームページ URL、プライバシーポリシー URL を用意している

補足:

- Google の公開運用では、スコープや公開形態に応じて verification が必要になる場合があります
- 追加の Google API scope を要求する場合は、review 要件が厳しくなることがあります

## 5. GitHub OAuth の設定手順

### 5.1 OAuth App を作成

1. GitHub にログインする
2. `Settings`
3. `Developer settings`
4. `OAuth Apps`
5. `New OAuth App`

入力項目:

- `Application name`: 例 `Growth Hach Local`
- `Homepage URL`: アプリの URL
- `Application description`: 任意
- `Authorization callback URL`: callback URL

ローカル:

- `Homepage URL`: `http://localhost:4180`
- `Authorization callback URL`: `http://localhost:4180/api/auth/callback/github`

本番:

- `Homepage URL`: `https://<本番ドメイン>`
- `Authorization callback URL`: `https://<本番ドメイン>/api/auth/callback/github`

作成後:

- `Client ID` を控える
- `Generate a new client secret` で `Client Secret` を発行して控える

### 5.2 GitHub 側の重要な制約

GitHub OAuth App は callback URL を複数持てません。

実務上の推奨:

- ローカル用 OAuth App を 1 つ作る
- 本番用 OAuth App を 1 つ作る

例:

- `Growth Hach Local`
- `Growth Hach Production`

これを分けないと、ローカル開発と本番運用を同じ App で両立しづらくなります。

### 5.3 GitHub App を使う場合の注意

このリポジトリは通常の OAuth App で十分です。

もし GitHub App を使う場合は、Better Auth 公式ドキュメントにあるとおり、`Email Addresses` の読み取り権限を有効化してください。

設定場所:

1. GitHub App 作成後に `Permissions and Events`
2. `Account Permissions`
3. `Email Addresses`
4. `Read-only`

補足:

- OAuth App の場合は通常この追加設定は不要です
- Better Auth の GitHub ドキュメントでは `user:email` が重要であることが明記されています

## 6. ローカル動作確認手順

1. `.env.local` などに環境変数を設定する
2. `pnpm dev` を起動する
3. ブラウザで `http://localhost:4180/login` を開く
4. `Googleで続ける` を押してログインできることを確認する
5. `GitHubで続ける` を押してログインできることを確認する
6. 初回ログイン後にオンボーディングへ遷移することを確認する
7. ログアウト後に再ログインできることを確認する

見るべきポイント:

- callback 後に `/api/auth/callback/google` または `/api/auth/callback/github` でエラーにならない
- 初回ユーザ作成時に users / sessions / accounts が作られる
- 管理者メールを `ADMIN_EMAILS` に入れた場合、`role=admin` になる

## 7. 本番反映手順

1. 本番ドメインを決める
2. `BETTER_AUTH_URL` を本番ドメインに切り替える
3. Google の本番 redirect URI を追加する
4. GitHub の本番 OAuth App を作成する
5. 本番の `GOOGLE_CLIENT_ID / SECRET` と `GITHUB_CLIENT_ID / SECRET` をデプロイ環境へ設定する
6. `BETTER_AUTH_SECRET` を本番固定値で設定する
7. デプロイ後、実際の本番 URL でログインを確認する

## 8. トラブルシューティング

### 8.1 `redirect_uri_mismatch`

原因:

- `BETTER_AUTH_URL` が OAuth プロバイダ側の callback URL と一致していない
- `localhost:4180` ではなく `5173` や別ポートを登録している
- パスが `/api/auth/callback/...` ではなく別パスになっている

確認箇所:

- `BETTER_AUTH_URL`
- Google / GitHub 側の callback URL
- Better Auth の `basePath`

### 8.2 Google で test user エラーになる

原因:

- OAuth consent screen が `External + Testing`
- 利用中の Google アカウントが `Test users` に入っていない

対応:

- 対象アカウントを `Audience > Test users` に追加する

### 8.3 GitHub は通るが本番だけ失敗する

原因:

- GitHub OAuth App がローカル callback URL のまま
- 本番 URL 用の App を作っていない

対応:

- 本番専用の OAuth App を作る
- 本番 callback URL を設定した App の credential を使う

### 8.4 ログイン後すぐセッションが壊れる

原因候補:

- `BETTER_AUTH_SECRET` が変わっている
- `BETTER_AUTH_URL` が reverse proxy 構成とずれている
- Cookie のドメイン/URL 前提が本番環境とずれている

## 9. 推奨運用

最小でも以下の分離を推奨します。

- Google Cloud project: `local/staging` と `production` を分離
- GitHub OAuth App: `local` と `production` を分離
- `BETTER_AUTH_SECRET`: 環境ごとに固定値を分離

理由:

- callback URL の衝突を避けやすい
- 誤って本番 credential をローカルで使う事故を防げる
- OAuth 同意画面やテストユーザ管理を分離できる

## 10. 設定チェックリスト

### 10.1 ローカル

- [ ] `BETTER_AUTH_URL=http://localhost:4180`
- [ ] Google callback URL を登録済み
- [ ] GitHub callback URL を登録済み
- [ ] `GOOGLE_CLIENT_ID / SECRET` を設定済み
- [ ] `GITHUB_CLIENT_ID / SECRET` を設定済み
- [ ] `BETTER_AUTH_SECRET` を設定済み
- [ ] Google test user に自分のアカウントを追加済み

### 10.2 本番

- [ ] `BETTER_AUTH_URL=https://<本番ドメイン>`
- [ ] Google 本番 callback URL を登録済み
- [ ] GitHub 本番 callback URL を登録済み
- [ ] 本番用 credential を設定済み
- [ ] 本番用 `BETTER_AUTH_SECRET` を設定済み
- [ ] 公開用アプリ情報を見直し済み
- [ ] 実際の本番 URL でログイン確認済み

## 11. 参考リンク

以下は 2026-03-07 時点で確認した一次情報です。

- Better Auth Google: [https://www.better-auth.com/docs/authentication/google](https://www.better-auth.com/docs/authentication/google)
- Better Auth GitHub: [https://www.better-auth.com/docs/authentication/github](https://www.better-auth.com/docs/authentication/github)
- Google OAuth consent screen: [https://developers.google.com/workspace/guides/configure-oauth-consent](https://developers.google.com/workspace/guides/configure-oauth-consent)
- Google OAuth web server flow: [https://developers.google.com/identity/protocols/oauth2/web-server](https://developers.google.com/identity/protocols/oauth2/web-server)
- Google OAuth production readiness: [https://developers.google.com/identity/protocols/oauth2/production-readiness/policy-compliance](https://developers.google.com/identity/protocols/oauth2/production-readiness/policy-compliance)
- GitHub OAuth App 作成: [https://docs.github.com/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app](https://docs.github.com/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)
