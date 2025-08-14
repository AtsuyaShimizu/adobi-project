# フロントエンドアプリケーション概要

## 画面一覧と主要機能
- **スケジュールページ**
  - `SchedulePageComponent` がアプリ全体のコンテナとなり、タスクとメモを読み込み、現在時刻を表示します。
  - レイアウトは `ScheduleLayoutComponent` が担当し、ヘッダー、ガントチャート、タスクフォーム、各種モーダル、フッターを組み合わせて表示します。
  - ガントチャート上でタスクの期間・進捗を可視化し、クリックで詳細表示、Shift+スクロールで横移動、フィルタ機能を備えています。
  - メモを任意位置に作成・ドラッグ・リサイズでき、ガントチャートに重ねて表示します。
  - カレンダーモーダルから任意の日付にジャンプでき、フッターには現在時刻が表示されます。

## フォルダ構成
```
asobi-project-fe/src/app/
├── page
│   └── schedule              # ページコンポーネント
├── view                      # 表示専用のビューコンポーネント
│   ├── layouts
│   │   └── schedule-layout   # レイアウトコンポーネント
│   └── parts
│       ├── gantt-chart       # ガントチャート
│       ├── task-form         # タスク入力フォーム
│       ├── calendar-modal    # 日付選択モーダル
│       ├── memo              # 付箋表示
│       ├── memo-modal        # 付箋入力モーダル
│       ├── task-detail-modal # タスク詳細モーダル
│       ├── header            # ヘッダー
│       └── footer            # フッター
├── domain
│   ├── model                 # エンティティ定義
│   ├── state                 # アプリ状態
│   │   ├── interface         # 状態インターフェース
│   │   ├── local             # ローカル状態
│   │   └── global            # グローバル状態
│   └── service               # ビジネスロジック
│       ├── interface         # サービスインターフェース
│       └── impl              # サービス実装
└── infrastructure
    ├── api                   # 外部APIアクセス
    └── repository            # 永続化リポジトリ
```

## アーキテクチャと依存関係
- ページコンポーネントはサービスを介して状態を取得・更新し、その結果をビューコンポーネントへ渡します。
- ビューコンポーネントは表示とユーザー操作イベントの発行のみを担当します。
- サービスはビジネスロジックを担い、状態クラスとリポジトリを操作します。
- 状態クラスは `WritableSignal` を用いてアプリ状態を保持し、読み取り専用シグナルを外部へ公開します。
- リポジトリは API クラスを通じて外部データソースと通信します。

## クラスおよびインターフェース概要
### ドメインモデル
- **`Task`**: タスクのエンティティ。`id`、`type`、`name`、`detail`、`assignee`、`start`、`end`、`progress` を保持。
- **`Memo`**: 付箋のエンティティ。`id`、`text`、`x`、`y`、`width`、`height` を保持。

### ステート
- **`ScheduleState`**: タスクリストを保持。`add`、`update`、`remove` で状態を変更。
- **`MemoState`**: メモ一覧を管理。`add`、`update`、`remove` を提供。
- **`TeamState`**: チームメンバー一覧をグローバルに保持。`setMembers` で更新。
- **`ClockState`**: 現在時刻を保持。`setNow` により更新。

### サービス
- **`ScheduleService`**: タスクの読み込み・追加・更新・削除・進捗加算を提供。`ScheduleRepository` と `ScheduleState` を使用。
- **`MemoService`**: メモの追加・更新・削除を `MemoState` を通じて行うシンプルなサービス。
- **`ClockService`**: 1 分ごとに現在時刻を更新し `ClockState` に反映。

### リポジトリ / API
- **`ScheduleRepository`**: `ScheduleApi` を呼び出し、タスクデータの取得・保存・更新・削除を行う。
- **`ScheduleApi`**: HTTP クライアントで `http://localhost:3000/tasks` にアクセスし、タスクデータを CRUD 操作する。

### ビューコンポーネント
- **`ScheduleLayoutComponent`**: 各パーツを組み合わせたレイアウト。フォームやモーダルの開閉、メモ作成やタスク進捗入力などのイベントを親に通知。
- **`GanttChartComponent`**: タスクとメモを受け取り、期間表示、フィルタリング、ドラッグ・リサイズ、進捗入力、範囲変更通知など豊富な機能を提供。
- **`TaskFormComponent`**: タスクの入力・編集フォーム。`initialTask` を入力として受け取り、`save` イベントでタスクを出力。
- **`HeaderComponent`** / **`FooterComponent`**: それぞれログアウト通知と現在時刻の表示を担当。
- **`MemoComponent`** / **`MemoModalComponent`**: 付箋の表示と作成。
- **`TaskDetailModalComponent`**: タスク詳細の表示と `edit` / `delete` イベントの発行。
- **`CalendarModalComponent`**: カレンダーから日付を選択し `confirm` で親に通知。

## フィールド・関数の例
- `SchedulePageComponent` の主なシグナル: `isFormVisible`、`isCalendarVisible`、`selectedTask` など。`openForm`、`onSave`、`onProgressInput` などのハンドラーを持つ。
- `ScheduleService.add(task)` はリポジトリ保存後に `ScheduleState` へタスクを追加。
- `GanttChartComponent` は `memoChange`、`taskClick`、`progressInput` など多数の `EventEmitter` を提供し、`moveSpan` や `updateRange` などのメソッドで表示期間を制御。

