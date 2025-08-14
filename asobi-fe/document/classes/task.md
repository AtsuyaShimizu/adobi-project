# Task

タスクを表すインターフェース。

## フィールド
| フィールド | 型 | 説明 |
|---|---|---|
| id | string | 識別子 |
| type | string | 分類（フェーズなど） |
| name | string | タスク名 |
| detail | string | 詳細説明 |
| assignee | string | 担当者 |
| start | Date | 開始日 |
| end | Date | 終了日 |
| progress | number | 進捗率(0-100) |

## 関連ファイル
- `src/app/domain/model/task.ts`
