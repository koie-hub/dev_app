# CONTRIBUTING — 開発ガイド（dev_app）

## 0. 目的
新メンバーが迷わず参加できるよう、環境構築・コーディング規約・PR運用・テスト・セキュリティの基本を定義します。

## 1. 前提バージョン
- Node.js: 20.x
- pnpm: 9.x
- Flutter: 最新安定（stable）
- Dart: Flutter同梱
- PostgreSQL: 15 以降推奨
- OS: macOS / Windows / Linux

## 2. リポジトリ構成（例）
/frontend_flutter
/backend_nest
/docs

## 3. 初期セットアップ
バックエンド（Nest.js）
    cd backend_nest
    pnpm install
    cp .env.example .env    ← 必要値を設定（下記「環境変数」参照）
    pnpm prisma generate
    pnpm start:dev

フロントエンド（Flutter）
    cd frontend_flutter
    flutter pub get
    flutter run -d chrome   （もしくは iOS/Android 実機/エミュ）

ローカルDB（任意: Docker）
    docker run --name dev-postgres -e POSTGRES_PASSWORD=dev -p 5432:5432 -d postgres:15

## 4. スクリプト（目安）
バックエンド
    pnpm lint
    pnpm test
    pnpm test:e2e
    pnpm build

フロントエンド
    dart analyze
    flutter test

## 5. コーディング規約
- TypeScript: ESLint + Prettier（または Biome）。strictNullChecks を有効。
- Dart/Flutter: effective Dart 準拠。Widget 分割、小さな責務。
- 設計原則: SOLID / DRY / 小さなPR / テスト先行を推奨。
- 例外処理: 失敗前提設計（API/DB/ネットワークの失敗パスを明示）。

## 6. コミット規約（Conventional Commits）
- 種別: feat / fix / docs / chore / refactor / test / perf / ci
- 例: feat(expenses): submit API with validation
- PRタイトルも上記に準拠。

## 7. ブランチ戦略
- main: 安定。保護設定。
- feat/*, fix/* から PR → main。レビュー必須。squash merge 推奨。

## 8. PR テンプレ（チェック事項の目安）
- 目的 / 変更点 / 影響範囲
- 動作確認手順（スクショ歓迎）
- テスト（追加/更新）と結果
- 秘密情報が含まれていないことを確認
- 監査/ログ・権限・エラーパスの確認

## 9. テスト方針（要約）
- Unit（高速, モック中心）、Integration（DB/外部I/F）、E2E（API/Flutter Widget & Golden）
- カバレッジ目標: backend 80% / frontend 70% を目安（例）

## 10. 環境変数（例）
バックエンド（.env）
    DATABASE_URL=postgresql://user:pass@localhost:5432/dev
    COGNITO_REGION=ap-northeast-1
    COGNITO_USER_POOL_ID=xxxxx
    COGNITO_CLIENT_ID=xxxxx
    JWT_AUDIENCE=dev_app
    S3_BUCKET=dev-app-receipts
    S3_REGION=ap-northeast-1
    LOG_LEVEL=info

フロントエンド（.env や flavors 等で管理）
    API_BASE_URL=https://api.example.com/v1
    SENTRY_DSN=

※ Secrets は Git に絶対入れない。クラウドは Secrets Manager / SSM を使用。

## 11. 依存更新
- Renovate / Dependabot を使用。破壊的変更は CHANGELOG に記録。

## 12. 連絡
- Slack: #dev_app
- 緊急時: 担当者にメンション
