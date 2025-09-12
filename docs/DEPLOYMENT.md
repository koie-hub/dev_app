# DEPLOYMENT — デプロイ運用（dev_app / AWS）

## 0. 環境
- dev / stg / prod（最低3環境）
- リージョン: ap-northeast-1（東京）想定

## 1. 方針
- コンテナ: ECS Fargate
- DB: RDS for PostgreSQL（Multi-AZ）
- 配信: ALB + WAF、静的は CloudFront + S3
- 認証: Cognito
- IaC: Terraform or AWS CDK
- CI/CD: GitHub Actions → ECR/ECS（必要に応じ CodeDeploy Blue/Green）

## 2. ランタイム構成（概要）
- Backend: Nest.js を Docker ビルド
- Frontend Web（必要時）: Flutter Web をビルドし S3/CloudFront 配信
- 環境変数は SSM/Secrets Manager から注入

## 3. GitHub Actions（例の流れ）
main へマージ → 以下ジョブ
- Lint/Test（backend/frontend）
- Docker build & push to ECR
- prisma migrate（安全に実行）
- ECS service update（min=100% max=200% の rolling もしくは Blue/Green）
- キャッシュ/Invalidation（CloudFront）

例コマンド（概念）
    docker build -t $ECR_REPO:sha-xxxx .
    docker push $ECR_REPO:sha-xxxx
    aws ecs update-service --cluster dev-app --service api --force-new-deployment

## 4. 環境変数とシークレット（例）
- DATABASE_URL, COGNITO_*, JWT_AUDIENCE
- S3_BUCKET, S3_REGION
- SENTRY_DSN, LOG_LEVEL
管理: Secrets Manager / SSM、GitHub Secrets 経由で注入

## 5. ヘルスチェック/ロールバック
- /v1/health が 200 で安定後に切替
- 失敗時は直前リビジョンへロールバック（ECS/CodeDeploy）

## 6. 監視・可観測性
- CloudWatch（メトリクス/ログ/アラーム）
- X-Ray（トレーシング）
- 重要指標: p95 レイテンシ、5xx率、ECS CPU/メモリ、RDS 指標

## 7. リリース手順（要約）
- PR レビュー完了
- CHANGELOG 更新
- タグ付与（セマンティックバージョニング）
- main マージ → Actions が自動デプロイ
- 動作確認チェックリストを実施

## 8. 変更管理
- すべての変更は Issue/PR に紐付け
- 緊急修正は hotfix/* ブランチ → main

## 9. 注意事項
- マイグレーションは後方互換に配慮（2段階移行）
- 秘密情報のログ出力禁止
