# TaskFormComponent

タスクを入力するフォームコンポーネント。

## フィールド
- `task` — 入力値を保持する内部状態。

## 入出力
- `@Input() initialTask` — 初期表示するタスク。
- `@Output() save` — 入力されたタスクを通知。

## メソッド
- `submit()` — 入力値から`Task`を生成し`save`イベントを発火。
- `reset()` — 内部状態を初期化。
- `formatDate(date)` — 日付を`YYYY-MM-DD`形式に変換。

## 関連ファイル
- `src/app/view/parts/task-form/task-form.component.ts`
