# MemoComponent

ガントチャート上に配置するメモを表示・編集するコンポーネント。

## 入出力
- `@Input() memo: Memo` — 表示するメモ。
- `@Input() editing: boolean` — 編集モード。
- `@Output() memoMouseDown` — ドラッグ開始イベント。
- `@Output() memoMouseUp` — ドラッグ終了イベント。
- `@Output() memoResizeMouseDown` — リサイズ開始イベント。
- `@Output() memoBlur` — フォーカス喪失イベント。
- `@Output() editToggle` — 編集モード切替イベント。

## メソッド
- `onMouseDown(event)` — ドラッグ開始イベントを発火。
- `onMouseUp(event)` — ドラッグ終了イベントを発火。
- `onResizeMouseDown(event)` — リサイズ開始イベントを発火。
- `onBlur(event)` — 編集内容確定を通知。
- `onEditButton(event)` — 編集モードを切り替え。

## 関連ファイル
- `src/app/view/parts/memo/memo.component.ts`
