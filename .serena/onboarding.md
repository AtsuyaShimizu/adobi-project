# Asobi FE Onboarding

## プロジェクト概要
- 名称: asobi（FE）
- 種別: Angular フロントエンド（ゾーン非依存）
- 目的: View/Service/State を明確に分離したクリーンなアーキテクチャでのフロント実装

## 技術スタック
- フレームワーク: Angular v20（Zone.js 未使用）
- 言語: TypeScript
- Node: v22.13.1（ローカル環境検出）
- ビルド/CLI: Angular CLI（プロジェクト内設定に準拠）

## コーディング/設計ルール（AGENTS.md 反映）
- ブール命名: 真で肯定状態を表す（例: `isEnabled`, `hasAccess`, `isAvailable`）。否定表現の真値は禁止。
- フロント構成:
  - View（`View/`）: ステートレス。表示とイベント発火のみ。
  - Service（`domain/service/`）: ビジネスロジック。View と State の橋渡し。
  - State（`domain/state/`）: 状態管理。外部公開は読み取り専用 getter のみ。変更は定義メソッド経由かつ原則 Service からのみ。
  - Page: コンテナ。View のイベントを適切な Service メソッドへ委譲。State は Service 経由で取得し View に渡す。
- Signal 宣言: `computed` 等の読み取り専用を除き、`WritableSignal` を使用（global/local state）。
- Zone.js: 使用しない。アプリはゾーン非依存構成とする。
- コミュニケーション言語: 日本語（ログ/サマリーなど）。

## 作業ディレクトリ
- Serena プロジェクトルート: `/Users/atsuya/asobi`
- 現在の FE ワークスペース: `/Users/atsuya/asobi/asobi-fe/asobi-project-fe`

## MCP / Serena 利用
- SerenaMCP: 接続済み。プロジェクト `asobi` 有効化済み。
- 設定ファイル: `/Users/atsuya/asobi/.serena/project.yml`
- 初期方針: 本メモリのルールを厳守。ゾーン非依存・Signal 中心の状態管理。

## 運用メモ
- 追加のガイドライン（Lint/Format/Commit 規約など）があれば追記予定。
- 未確定事項（API 仕様・ルーティング戦略等）は確定次第、別メモとして分離管理。
