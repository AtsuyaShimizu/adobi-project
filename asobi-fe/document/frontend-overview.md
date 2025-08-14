# フロントエンドアプリケーション概要

## 1. アプリの機能説明
- タスクの追加・更新・削除、進捗管理。
- ガントチャートでのタスク表示とメモ配置。
- カレンダーから任意の日付へスクロール。
- タスク詳細の閲覧・編集、メモの移動・リサイズ。

## 2. 画面機能説明
### スケジュールページ
- ヘッダー、フッター、ガントチャートで構成。
- タスクフォームでタスクの登録・編集。
- メモモーダルでメモの作成・編集。
- カレンダーモーダルから指定日へジャンプ。
- タスク詳細モーダルで内容確認と削除。

## 3. ディレクトリ構造
```
src/app
├── domain
│   ├── model        # Task, Memoなどの型定義
│   ├── service      # ビジネスロジック
│   └── state        # Signalによる状態管理
├── infrastructure   # APIやリポジトリ
├── page             # コンテナコンポーネント
└── view             # 表示専用コンポーネント
```

## 4. クラスの依存関係
- **SchedulePageComponent** は **ScheduleService** と **MemoService** を利用し、状態を取得して各ビューに渡す。
- **ScheduleService** は **ScheduleRepository** を介してAPIと通信し、結果を **ScheduleState** に反映する。
- **MemoService** は **MemoState** を操作してメモを管理する。
- **view** 配下のコンポーネントは受け取った状態を表示し、ユーザー操作をイベントとして発火する。

## 5. クラス概要
- [Task](classes/task.md)
- [Memo](classes/memo.md)
- [ScheduleService](classes/schedule-service.md)
- [ScheduleState](classes/schedule-state.md)
- [MemoService](classes/memo-service.md)
- [MemoState](classes/memo-state.md)
- [SchedulePageComponent](classes/schedule-page-component.md)
- [TaskFormComponent](classes/task-form-component.md)
- [GanttChartComponent](classes/gantt-chart-component.md)
- [MemoComponent](classes/memo-component.md)
