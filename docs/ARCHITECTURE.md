# アーキテクチャ概要（dev_app / AWS版）

対象: koie-hub/dev_app リポジトリ  
目的: システム全体の構成・利用技術・依存関係を整理し、AWS上での実装前提を明確化する。

---

## 1. システム全体像

- **フロントエンド**: Flutter  
  - 対応: iOS / Android / Web  
  - 状態管理: Riverpod または Bloc  
  - UI: Material 3、アクセシビリティ対応

- **バックエンド**: Nest.js (Node.js Framework)  
  - 言語: TypeScript  
  - API: REST（将来的に GraphQL 併用可）  
  - ORM: Prisma  
  - 認証: JWT + Cognito（SSO対応）

- **データベース**: Amazon RDS for PostgreSQL  
  - マルチAZ配置、バックアップ保持 7年（法令対応）

- **インフラ基盤**: AWS  
  - CI/CD: GitHub Actions → AWS CodeDeploy  
  - IaC: Terraform（または AWS CDK）  
  - 監視: Amazon CloudWatch + AWS X-Ray  
  - ログ保存: Amazon S3（ライフサイクル7年）

---

## 2. AWSリソース構成

- **VPC**  
  - パブリックサブネット: ALB, NAT Gateway  
  - プライベートサブネット: ECS(Fargate) / RDS(PostgreSQL)  

- **コンテナ基盤**  
  - Amazon ECS (Fargate)  
  - AutoScaling（CPU/メモリ利用率トリガー）

- **API公開**  
  - Application Load Balancer (ALB)  
  - AWS WAF でセキュリティ強化  
  - ACMによるTLS証明書（TLS1.3）

- **認証・セキュリティ**  
  - Amazon Cognito（ユーザ管理、SSO）  
  - AWS IAMで最小権限ポリシー  
  - KMSで暗号化（RDS/S3/ログ）

- **ストレージ**  
  - Amazon S3: 領収書・証憑の保存  
  - バージョニング有効化  
  - ライフサイクル: 7年保持後、自動 Glacier アーカイブ

- **ネットワーク**  
  - Route53: 独自ドメイン管理  
  - CloudFront: 静的ファイル配信（Flutter Web対応）

---

## 3. 非機能要件

- **可用性**: RDS マルチAZ + ECS AutoScaling  
- **セキュリティ**: WAF, GuardDuty, CloudTrail, KMS暗号化  
- **監査**: CloudTrailログをS3に7年保存（電帳法/インボイス対応）  
- **バックアップ/DR**: RDS自動バックアップ + S3クロスリージョンレプリケーション

---

## 4. アーキテクチャ図（テキスト表現・折り返し対応）

Flutter (iOS/Android/Web)  
    │  
    ▼  
CloudFront + Route53  
    │  
    ▼  
ALB + WAF  
    │  
    ▼  
ECS Fargate (Nest.js)  
    │  
    ▼  
RDS PostgreSQL (Multi-AZ)  
    │  
    ▼  
S3（領収書・ログ7年保存）

---

## 5. 今後の検討事項

- Terraform か AWS CDK かのIaC標準化  
- S3に保存する証憑ファイルの電子署名（改ざん防止）  
- Flutter Web本番利用時のパフォーマンスチューニング  
- 監査要件に合わせたログの整形・検索（Athena/QuickSight活用）  

---
