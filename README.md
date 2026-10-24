# Glass Tasks

モバイルファーストのタスク管理Webアプリ。白基調のLiquid Glass UI、即時メモ、フリックでのステータス変更に対応します。

- 公開URL: https://glass-tasks.nao09a16.workers.dev
- ソース: https://github.com/nao-gith/glass-tasks

## 操作

メモ欄に入力し、＋ボタンまたは Enter で追加。Shift + Enter で改行、Ctrl / Cmd + K で入力欄へ移動します。日本語変換中のEnterでは追加しません。カードを右へフリックすると未着手 → 進行中 → 完了、左へフリックするとひとつ戻ります。丸ボタンで完了を切り替え、三点ボタンから内容・期限・優先度・ステータスを編集できます。削除は直後に取り消せます。

日付と達成率の下にコンパクトな入力欄を置き、タスクを未着手・進行中・完了のグループに分けて表示。画面下部のフローティングフィルターで状態を絞り込みます。背景は白を基調に淡い青とピンクを重ねています。

未ログイン時のタスクと下書きは端末内に保存。Googleログイン後はユーザーごとにD1へ保存され、アカウント画面で端末内のメモを明示的に取り込めます。AI整理では、メモをWorkers AIへ送り、候補を編集・確認してから一括追加します。

## 技術選定と理由

| 技術 | 選んだ理由 |
| --- | --- |
| React 18 | 入力・絞り込み・モーダル・非同期処理の状態を一貫して管理するため |
| TypeScript | タスクのステータスやデータ構造の誤りをビルド時に見つけるため |
| Vite | 小さな静的フロントエンドを高速に開発・ビルドするため。SSR不要の個人用タスク画面に適しているため |
| CSS / backdrop-filter | Web上で半透明、背景ぼかし、反射感を表現するため。AppleのネイティブAPIそのものではありません |
| CSS animations / Pointer Events | フリック、カード登場、進捗、モーダル、スケルトンの動きを軽量に実装するため。動きを減らすOS設定にも対応 |
| Cloudflare Workers + Static Assets | UIとAPIを同じオリジンに置き、サーバー管理なしで公開するため |
| Cloudflare D1 | ユーザー・タスク・期限・セッションをSQLで保存し、ユーザー単位でアクセスを制限するため |
| Workers AI | 外部AIプロバイダーのAPIキーを持たず、Cloudflareのバインディングでメモを整理するため |
| Google OAuth 2.0 + PKCE | Googleだけでログインし、自社パスワードを保存しないため。stateとPKCEで認証リクエストを保護 |
| HttpOnly / Secure / SameSite cookies | セッション情報をJavaScriptから読めない形で保持するため。DBにはトークンのSHA-256ハッシュのみを保存 |
| localStorage | ログイン前のメモ・下書きを即座に保存するため。共有端末では同じブラウザ利用者から見えるため注意 |
| Lucide React | 軽量で統一したアイコン表現のため |
| Web App Manifest | ホーム画面から起動できる構成のため。オフライン起動は現状非対応 |
| Node標準test / SQLite | 認可・入力検証・保存・AI応答を外部テストサービスなしで確認するため |
| GitHub / GitHub Actions | 変更履歴を残し、pushごとに型チェック・ビルド・APIテストを実施するため |

## 開発

Node.js 22.13以降を使用します。

```sh
npm ci
npm run build
npm test
npx wrangler d1 migrations apply glass-tasks-db --local
npm run worker:dev
```

Worker開発サーバーでUIとAPIを同一オリジンで確認します。UIのみの開発は別ターミナルで `npm run dev`。ViteはAPIをポート8787へ転送します。

## Google認証の設定

Google CloudでWebアプリ用OAuthクライアントを作成し、リダイレクトURIに次を登録します。

```text
https://glass-tasks.nao09a16.workers.dev/auth/callback
```

Cloudflareへ秘密値を設定します。値をソースやGitHubへ書き込まないでください。

```sh
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
```

ローカルではGit対象外の `.dev.vars` に同じキー名を設定します。認証情報が未設定の場合、アプリはログイン準備中と表示します。

## 公開

```sh
npm run build
npm test
npx wrangler d1 migrations apply glass-tasks-db --remote
npx wrangler deploy
```

`wrangler.jsonc` はこのプロジェクトのCloudflareアカウント・D1を指定しています。フォークする場合は自分のIDへ変更してください。秘密値は含まれていません。

## 保護と制限

- データAPIはセッション必須。すべてのSQL操作をユーザーIDで絞り込みます。
- 書き込みは同一Originのみ。タスク本文は2000文字まで、AIは1ユーザーあたり毎時20回まで。
- Googleのパスワード、Googleのアクセストークンは保存しません。セッションは7日で失効します。
- APIはキャッシュしません。期限切れセッションなどを毎日削除します。
- 端末間の同時編集は最後の保存を優先します。リアルタイム共同編集ではありません。

## 検証状況

自動テスト15件、型チェック、本番ビルド、GitHub Actionsが合格。依存パッケージの監査も既知の脆弱性0件です。公開URLでメモ追加、下書き復元、編集、期限、優先度、左右フリック、検索、完了フィルター、並べ替え、削除取り消し、320px・390px・1280pxの表示を操作確認しました。詳細は [TEST-REPORT.md](TEST-REPORT.md) を参照してください。

Google Cloudの初回規約同意はユーザー操作待ちです。Google認証設定・実アカウントの認証・認証後のWorkers AI実行は未完了であり、全要件の完了とはしていません。

## 参考資料

- [Apple Liquid Glass](https://developer.apple.com/documentation/technologyoverviews/liquid-glass)
- [Apple Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- [Workers AI binding](https://developers.cloudflare.com/workers-ai/configuration/bindings/)
- [Google OAuth web server flow](https://developers.google.com/identity/protocols/oauth2/web-server)
