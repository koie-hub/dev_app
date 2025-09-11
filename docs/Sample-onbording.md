了解です。実装は一旦置いて、開発環境の構築手順書から固めましょう。
そのまま README や社内 Wiki に貼って使える “叩き台（テンプレート）” を用意しました。スタック未確定でも使えるように、Docker/Dev Container 方式（推奨）とネイティブ方式の二本立てにしています。必要な箇所に🔧プレースホルダを残してあるので、決まり次第そこだけ差し替えれば完成です。

⸻

テスト開発 — 開発環境構築手順書（v0.1）

この文書は「テスト開発」プロジェクトの開発環境を再現性高く・短時間で立ち上げるための手順をまとめたものです。
推奨は Docker + VS Code Dev Container。ネイティブ環境の手順も併記します。

⸻

0. 概要
	•	対象読者：新規参加メンバー／環境を作り直すメンバー
	•	想定 OS：macOS（Apple Silicon/Intel）、Windows 11（WSL2 推奨）、Ubuntu 22.04+
	•	言語／ランタイム（暫定）
	•	Backend 例：Python 3.11（Poetry）または Node.js 20（pnpm）
	•	Frontend 例：Node.js 20（pnpm / vite）
	•	DB 例：PostgreSQL 15（Docker）
	•	前提ツール：Git / VS Code / Docker Desktop（または Docker Engine）
	•	ブランチ戦略（暫定）：main（保護）＋短命トピックブランチ、PR 必須
	•	コード規約（例）：Conventional Commits、Lint & Format を CI で強制

⸻

1. 事前準備（共通）
	1.	アカウント/権限

	•	Git ホスティング：🔧<GitHub/GitLab 等> にアクセス権
	•	コンテナレジストリ：🔧<GHCR/ECR 等>（必要に応じて）

	2.	インストール

	•	Git
	•	VS Code（拡張機能は後述）
	•	Docker（macOS/Windows は Docker Desktop、Linux は Docker Engine + docker compose）

Windows は WSL2 + Ubuntu を推奨（VS Code Remote - WSL で開発）

⸻

2. はじめに決めること（差し替え欄）
	•	リポジトリ URL：🔧<https://…/test-dev.git>
	•	使用言語：🔧<Python / Node.js / 他>
	•	パッケージマネージャ：🔧<Poetry / pip / pnpm / npm / yarn>
	•	DB：🔧<PostgreSQL / MySQL / SQLite / 他>
	•	最低限の環境変数：🔧<DB_URL, SECRET_KEY, …>

決めたら .env.example に反映し、以降の手順書の該当箇所を置換してください。

⸻

3. クイックスタート（推奨：Docker + Dev Container）

OS 差を最小化し、全員まったく同じ環境で開発できます。

3.1 必要ファイルを追加（リポジトリ直下）

.devcontainer/devcontainer.json（テンプレ）

{
  "name": "test-dev",
  "dockerComposeFile": ["../docker-compose.yml"],
  "service": "app",
  "workspaceFolder": "/work",
  "features": {
    "ghcr.io/devcontainers/features/node:1": { "version": "20" },
    "ghcr.io/devcontainers/features/python:1": { "version": "3.11" }
  },
  "customizations": {
    "vscode": {
      "extensions": [
        "ms-python.python",
        "charliermarsh.ruff",
        "ms-azuretools.vscode-docker",
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "github.vscode-github-actions"
      ]
    }
  },
  "postCreateCommand": "bash .devcontainer/post-create.sh"
}

.devcontainer/post-create.sh

#!/usr/bin/env bash
set -euo pipefail

# Node
corepack enable || true
pnpm --version >/dev/null 2>&1 || npm i -g pnpm@8

# Python (Poetry)
pipx install poetry==1.8.3 || pip install --no-cache-dir poetry==1.8.3

# プロジェクト依存のインストール（存在する方のみ実行）
[ -f pyproject.toml ] && poetry install --no-root
[ -f package.json ] && pnpm install --frozen-lockfile || true

# pre-commit（Python を使う場合）
if [ -f .pre-commit-config.yaml ]; then
  pipx install pre-commit || pip install pre-commit
  pre-commit install
fi

echo "Dev container bootstrap finished."

docker-compose.yml（テンプレ）

version: "3.9"
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      - .:/work
    working_dir: /work
    depends_on:
      - db
    env_file:
      - .env
    command: sh -lc "sleep 1 && bash scripts/dev-run.sh"
    ports:
      - "3000:3000" # frontend dev server (必要なら)
      - "8000:8000" # backend api (必要なら)
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
      POSTGRES_DB: app
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:

Dockerfile（テンプレ）

FROM mcr.microsoft.com/devcontainers/base:ubuntu-22.04

# ここでは devcontainer の Features で Node/Python を入れる前提の最小 Dockerfile
# (追加の OS パッケージはここで)
RUN apt-get update && apt-get install -y --no-install-recommends \
    git curl make build-essential libpq-dev \
 && rm -rf /var/lib/apt/lists/*

scripts/dev-run.sh（テンプレ）

#!/usr/bin/env bash
set -euo pipefail

# Backend 例（Python/FastAPI）
if [ -f "pyproject.toml" ]; then
  poetry run alembic upgrade head 2>/dev/null || true
  poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
fi

# Frontend 例（Vite）
if [ -f "package.json" ]; then
  pnpm run dev --host 0.0.0.0 --port 3000
else
  # どちらもない場合は hang せずログを出して待機
  echo "No app to run. Provide package.json or pyproject.toml."
  tail -f /dev/null
fi

.env.example（テンプレ）

# ==== common ====
APP_ENV=local
LOG_LEVEL=debug

# ==== database ====
DB_HOST=db
DB_PORT=5432
DB_NAME=app
DB_USER=dev
DB_PASSWORD=dev
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}

# ==== backend ====
SECRET_KEY=changeme

.env.example をコピーして .env を作成し、必要値を設定してください（秘匿情報は Git にコミットしない）。

3.2 手順
	1.	リポジトリ取得

git clone 🔧<REPO_URL> test-dev
cd test-dev
cp .env.example .env


	2.	VS Code でフォルダを開き、**「Reopen in Container」**を選択
	3.	Dev Container が立ち上がったら、依存関係が自動インストールされ、DB（Postgres）も docker-compose で起動します。
	4.	アプリ起動（自動実行されない場合）

# Backend(FastAPI 例) / Frontend(Vite 例) の同時起動スクリプト
bash scripts/dev-run.sh


	5.	動作確認
	•	API: http://localhost:8000/docs
	•	Frontend: http://localhost:3000

⸻

4. ネイティブ環境のセットアップ（必要な場合）

どうしてもコンテナを使えない／使わない事情がある場合のプラン B です。

4.1 共通
	•	Node.js：Node 20 LTS＋corepack（pnpm 推奨）

# macOS: brew install node@20; corepack enable
corepack enable
npm i -g pnpm@8


	•	Python：3.11 系（pyenv または OS 同梱）＋Poetry 1.8

# pyenv + poetry の例
pyenv install 3.11.9 && pyenv local 3.11.9
curl -sSL https://install.python-poetry.org | python3 -


	•	PostgreSQL：ローカルに入れるより Docker での起動を推奨

docker run --name dev-postgres -e POSTGRES_PASSWORD=dev -e POSTGRES_USER=dev -e POSTGRES_DB=app -p 5432:5432 -d postgres:15



4.2 プロジェクト依存のインストール
	•	Backend（Python 例）

poetry install --no-root
# DB マイグレーション（Alembic 例）
poetry run alembic upgrade head
# 開発サーバ
poetry run uvicorn app.main:app --reload


	•	Frontend（Node 例）

pnpm install --frozen-lockfile
pnpm run dev



⸻

5. 開発時のよく使うコマンド（例）

Makefile（任意：OS 差を吸収）

.PHONY: setup dev test lint format up down db-reset

setup:
	@[ -f package.json ] && pnpm install --frozen-lockfile || true
	@[ -f pyproject.toml ] && poetry install --no-root || true

dev:
	bash scripts/dev-run.sh

test:
	@[ -f pyproject.toml ] && poetry run pytest -q || true
	@[ -f package.json ] && pnpm run test || true

lint:
	@[ -f pyproject.toml ] && poetry run ruff check . || true
	@[ -f package.json ] && pnpm run lint || true

format:
	@[ -f pyproject.toml ] && poetry run ruff format . || true
	@[ -f package.json ] && pnpm run format || true

up:
	docker compose up -d

down:
	docker compose down -v

db-reset:
	docker compose down -v && docker compose up -d db


⸻

6. VS Code 設定（例）

.vscode/settings.json

{
  "editor.formatOnSave": true,
  "files.eol": "\n",
  "python.analysis.typeCheckingMode": "basic",
  "python.defaultInterpreterPath": ".venv/bin/python",
  "ruff.fixAll": true,
  "[python]": { "editor.defaultFormatter": "charliermarsh.ruff" },
  "[javascript]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
  "[typescript]": { "editor.defaultFormatter": "esbenp.prettier-vscode" }
}

.vscode/extensions.json

{
  "recommendations": [
    "ms-python.python",
    "charliermarsh.ruff",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-azuretools.vscode-docker"
  ]
}


⸻

7. Lint / Format / Git hooks（例）
	•	Python：ruff（lint & format）
	•	Node：eslint + prettier
	•	Git hooks：pre-commit で共通化

.pre-commit-config.yaml（例）

repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.6.4
    hooks:
      - id: ruff
      - id: ruff-format
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.6.0
    hooks:
      - id: end-of-file-fixer
      - id: check-merge-conflict
      - id: trailing-whitespace


⸻

8. 環境変数と秘密情報
	•	.env.example を配布し、各自が .env を作る運用
	•	秘匿値は Git にコミット禁止。CI/CD はリポジトリの Secrets/Variables を使用
	•	共有が必要な初期値は 1Password/Keyvault 等で配布

⸻

9. CI（雛形）

.github/workflows/ci.yml（例）

name: CI
on:
  pull_request:
  push:
    branches: [ "main" ]
jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - uses: actions/setup-python@v5
        with: { python-version: '3.11' }
      - run: corepack enable
      - run: npm i -g pnpm@8
      - run: |
          [ -f package.json ] && pnpm install --frozen-lockfile || true
          [ -f pyproject.toml ] && pip install poetry==1.8.3 && poetry install --no-root || true
      - run: |
          [ -f pyproject.toml ] && poetry run ruff check . || true
          [ -f package.json ] && pnpm run lint || true
      - run: |
          [ -f pyproject.toml ] && poetry run pytest -q || true
          [ -f package.json ] && pnpm run test || true


⸻

10. 動作確認チェックリスト
	•	git clone できる
	•	Dev Container に再オープンできる（VS Code ステータスバー左下に「Dev Container」）
	•	docker compose ps で app と db が Up
	•	http://localhost:8000/docs が開く（Backend 例）
	•	http://localhost:3000 が開く（Frontend 例）
	•	make test が成功（または同等コマンド）

⸻

11. トラブルシューティング（抜粋）
	•	Dev Container が立ち上がらない
	•	Docker Desktop の起動確認、docker --version と docker compose version を確認
	•	Windows は WSL2 のディストリ有効化＆十分なメモリ割当
	•	ポート競合（3000/8000/5432）
	•	使われている場合は .env のポートや docker-compose.yml を調整
	•	依存のインストールに失敗
	•	Node：rm -rf node_modules pnpm-lock.yaml && pnpm install
	•	Python：poetry env remove --all && poetry install --no-root
	•	DB マイグレーションが当たらない
	•	alembic current / prisma migrate status など、採用ツールに合わせて確認

⸻

12. 変更の流れ（開発プロセス簡易版）
	1.	main からトピックブランチ作成（例：feat/xxx-yyy）
	2.	実装 → lint / test 通過
	3.	PR 作成（テンプレに沿って記述、スクショ/動作再現を添付）
	4.	CI パス後、レビュア 1 名以上の承認で main にマージ
	5.	マージ後、自動デプロイ（該当する場合）

⸻

13. 付録：採用技術が決まり次第の置換箇所一覧
	•	post-create.sh のパッケージ管理周り（pnpm/poetry）
	•	scripts/dev-run.sh の起動コマンド（uvicorn / vite / next dev など）
	•	docker-compose.yml のサービス名・ポート・追加ミドルウェア（例：Redis, MinIO）
	•	CI のテストランナー（pytest / jest / vitest / go test など）

⸻

最後に

このまま docs/dev-setup.md としてコミットすれば、オンボーディングに使えます。
次のステップとしては、スタック（Python/Node 等）と DB を確定し、上記の🔧プレースホルダを埋めていきます。確定後の想定スタック（例：Python + FastAPI + PostgreSQL や Node + Next.js + PostgreSQL）を教えていただければ、コマンドとファイルをピン留めした完成版に直してお渡しします。
