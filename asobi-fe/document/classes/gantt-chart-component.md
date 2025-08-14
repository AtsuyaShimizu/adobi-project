# GanttChartComponent

タスクとメモをガントチャート形式で表示するコンポーネント。

## 入出力
- `@Input() tasks: Task[]` — 表示するタスク。
- `@Input() memos: Memo[]` — 表示するメモ。
- `@Output() memoChange` — メモ編集イベント。
- `@Output() taskClick` — タスククリックイベント。
- `@Output() progressInput` — 進捗入力イベント。
- `@Output() rangeChange` — 表示期間変更イベント。

## 主なフィールド
- `dateRange: Date[]` — 表示期間の日付リスト。
- `taskViews: TaskView[]` — 表示用に加工されたタスク。
- `filters` — フィルタ状態。
- `spanOffset` — 表示範囲のオフセット。

## 主なメソッド
- `moveSpan(direction)` — 表示期間を月単位で移動。
- `onScrollbarMouseDown(event)` — 独自スクロールバーのドラッグ開始。
- `updateRange()` — 表示期間を再計算。
- `updateScrollbarThumb()` — スクロールバーの表示を更新。

## 関連ファイル
- `src/app/view/parts/gantt-chart/gantt-chart.component.ts`
