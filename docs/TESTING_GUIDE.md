# TESTING GUIDE — テスト方針（dev_app）

## 0. 目的
品質を自動で担保し、回帰を早期検知するための共通ルールを定義します。

## 1. テスト階層（ピラミッド）
- Unit: ビジネスロジックの最小単位。モック活用。高速に多量。
- Integration: DB/外部I/F含む接続性や振る舞い。
- E2E: ユースケース全体の確認（API / UI）。

## 2. バックエンド（Nest.js）
- フレームワーク: Jest
- Unit: Service/UseCase 単位。依存はモック（jest.fn）
- Integration: Prisma + Postgres。Testcontainers もしくは専用DBを起動
- E2E: supertest で HTTP 経由。Auth を通した実運用に近い形
- 目標: カバレッジ statement/branch 80%

推奨コマンド（目安）
    pnpm test
    pnpm test:watch
    pnpm test:e2e
    pnpm test:cov

## 3. フロントエンド（Flutter）
- Unit/Widget: flutter test
- Golden Test: UI 変化の回帰検知
- 集約: CI でスクリーンショット/レポートを保存
- 目標: statement 70%

推奨コマンド（目安）
    dart analyze
    flutter test

## 4. データとモック
- 固定テストデータは fixtures で管理
- 外部API は HTTP モック（例: nock 等）を利用
- 乱数/時刻は固定化（時刻は凍結、IDは固定シード）

## 5. CI 連携（GitHub Actions の例）
- トリガ: PR と main への push
- ジョブ:
  - Lint（TS/Dart）
  - Unit（backend/frontend）
  - Integration/E2E（必要に応じて matrix）
- 成果物: カバレッジレポート、E2Eログ、スクショを保存
- main への merge は全ジョブ成功が条件

## 6. パフォーマンスとセキュリティ
- 軽量なパフォーマンステスト（API応答時間の閾値チェック）
- 依存脆弱性スキャン（npm audit 等）をCIに組込み

## 7. レビュー観点
- 正常系/異常系/境界値が網羅されているか
- 権限・監査・ログ・エラーメッセージの妥当性
- 外部I/F障害時のリトライ/フォールバック

## 8. よくある落とし穴
- テストが外部ネットワークに依存（CI不安定）
- 時刻/タイムゾーン起因の不安定性
- ランダムIDによりスナップショットが揺れる
