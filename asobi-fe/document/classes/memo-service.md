# MemoService

メモの追加・更新・削除を行うサービス。`MemoServiceInterface`を実装する。

## フィールド
- `memos: Signal<Memo[]>` — 現在のメモ一覧。

## メソッド
- `add(memo: Memo)` — メモを追加。
- `update(memo: Memo)` — メモを更新。
- `remove(id: string)` — メモを削除。

## 依存関係
- `MemoState` — メモの状態管理。

## 関連ファイル
- `src/app/domain/service/interface/memo.service.ts`
- `src/app/domain/service/impl/memo.service.impl.ts`
