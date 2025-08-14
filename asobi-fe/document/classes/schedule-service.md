# ScheduleService

タスクの読み込みや変更を行うサービス。`ScheduleServiceInterface`を実装する。

## フィールド
- `tasks: Signal<Task[]>` — 現在のタスク一覧。

## メソッド
- `load()` — リポジトリからタスクを取得し状態に追加。
- `add(task: Task)` — タスクを追加。
- `update(task: Task)` — タスクを更新。
- `remove(id: string)` — タスクを削除。
- `addProgress(id: string, value: number)` — 指定タスクの進捗を加算。

## 依存関係
- `ScheduleRepository` — APIとの通信。
- `ScheduleState` — タスクの状態管理。

## 関連ファイル
- `src/app/domain/service/interface/schedule.service.ts`
- `src/app/domain/service/impl/schedule.service.impl.ts`
