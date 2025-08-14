# MemoState

メモ一覧をSignalで管理する状態クラス。

## フィールド
- `memos: Signal<Memo[]>` — 現在のメモ一覧。

## メソッド
- `add(memo: Memo)` — メモを追加。
- `update(memo: Memo)` — メモを更新。
- `remove(id: string)` — メモを削除。

## 関連ファイル
- `src/app/domain/state/interface/memo-state.ts`
- `src/app/domain/state/local/memo.state.ts`
