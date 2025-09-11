# API SPEC（v0.1）— dev_app / Nest.js

対象: koie-hub/dev_app
目的: フロント（Flutter）とバック（Nest.js）の契約を明確化

## 0. 前提
- Base URL: https://api.example.com/v1
- 認証: Bearer JWT（Cognito発行）
- Content-Type: application/json; charset=utf-8
- 日付/時刻: ISO 8601

## 1. エンティティ
- User: 従業員（roles: user, approver, accountant, admin）
- Expense: 立替精算申請
- Workflow: 状態遷移（draft → submitted → approved → paid → archived）

## 2. 主要エンドポイント
- GET /v1/health → サービス稼働確認
- GET /v1/me → ログインユーザ情報
- GET /v1/expenses → 申請一覧（status, limit, cursor などのクエリ対応）
- POST /v1/expenses → 新規申請（title, date, lines[]）
- POST /v1/expenses/:id/attachments → 領収書アップロードURL発行（S3署名URL）
- POST /v1/expenses/:id/submit → 申請提出（draft → submitted）
- POST /v1/expenses/:id/approve / /v1/expenses/:id/reject → 承認/却下（承認者）
- POST /v1/expenses/:id/pay → 支払確定（経理、paidAt 付与）

## 3. 共通エラー仕様（例）
    {
      "error": {
        "code": "VALIDATION_ERROR",
        "message": "...",
        "details": []
      }
    }
- 主なHTTP: 401 未認証 / 403 権限不足 / 404 未検出 / 409 競合 / 422 バリデーション

## 4. 監査ログ
- 重要操作は監査ログへ（誰が・いつ・何を）
- 添付ファイルは不可逆ハッシュ付与（改ざん検知）

## 5. バージョン管理
- 破壊的変更は /v2 を新設
- 旧仕様は90日間並走
