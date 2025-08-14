# フロントエンドアプリケーション概要

## 画面一覧
- **スケジュールページ**: ヘッダー、ガントチャート、タスク追加フォーム、メモ追加モーダル、カレンダーモーダル、タスク詳細モーダルで構成され、タスクの管理とメモ貼り付けを行う。

## 主な機能
- 初期表示時にタスク一覧を読み込み、現在時刻を表示。
- タスクの追加・更新・削除、進捗入力。
- ガントチャート上でメモの作成・移動・リサイズ。
- カレンダーから特定日へスクロール。
- タスク詳細の閲覧と編集。

## フォルダ構成
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

## フォルダ依存関係
- **page** は **service** を介して **state** と通信し、状態を **view** に渡す。
- **service** は **infrastructure**（API/Repository）を利用して外部データを取得・更新する。
- **view** は状態を受け取って描画し、ユーザー操作イベントを発火する。

## 主要クラスとインターフェース
### Taskインターフェース
| フィールド | 説明 |
|-----------|------|
| id | 識別子 |
| type | 分類（フェーズ） |
| name | タスク名 |
| detail | 詳細説明 |
| assignee | 担当者 |
| start/end | 期間 |
| progress | 進捗率(0-100) |

### Memoインターフェース
| フィールド | 説明 |
|-----------|------|
| id | 識別子 |
| text | 本文 |
| x/y | 配置位置 |
| width/height | サイズ |

### ScheduleServiceInterface
- `tasks`: 現在のタスク一覧をSignalで公開。
- `load()`: タスクを読み込み状態へ反映。
- `add(task)`, `update(task)`, `remove(id)`: タスクのCRUD。
- `addProgress(id, value)`: 進捗加算。

### ScheduleService実装
- `ScheduleRepository`と`ScheduleState`を利用。
- `load()`でAPIからタスクを取得し`ScheduleState`へ追加。
- 各CRUD操作時にリポジトリとステートを同期。

### ScheduleState
- `tasks`: `WritableSignal<Task[]>`で保持し、`add/update/remove`で変更。

### SchedulePageComponent
- サービスを注入し、`tasks`, `memos`, `dateTime`などを取得。
- `openForm()/closeForm()`でタスクフォームを制御。
- `openMemo()/closeMemo()`でメモモーダルを制御。
- `onSave()`でタスク保存、`onDelete()`で削除。
- `onMemoCreate()`でメモ生成、`onProgressInput()`で進捗更新。

## 関数・フィールド概要
- **タスクフォーム(TaskFormComponent)**: 入力値を`Task`に整形し`save`イベントを発火。
- **ガントチャート(GanttChartComponent)**: タスク表示、フィルタ、メモ編集、スクロールレンジ管理。
- **メモコンポーネント(MemoComponent)**: メモのドラッグ・リサイズ・編集操作をイベントとして提供。

