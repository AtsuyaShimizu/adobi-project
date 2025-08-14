# ScheduleState

タスク一覧をSignalで管理する状態クラス。

## フィールド
- `tasks: Signal<Task[]>` — 現在のタスク一覧。

## メソッド
- `add(task: Task)` — タスクを追加。
- `update(task: Task)` — タスクを更新。
- `remove(id: string)` — タスクを削除。

## 関連ファイル
- `src/app/domain/state/interface/schedule-state.ts`
- `src/app/domain/state/local/schedule.state.ts`
