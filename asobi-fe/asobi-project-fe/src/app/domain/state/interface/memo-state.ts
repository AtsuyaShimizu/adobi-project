import { Signal } from '@angular/core';
import { Memo } from '../../model/memo';

export interface MemoStateInterface {
  readonly memos: Signal<Memo[]>;
  add(memo: Memo): void;
  update(memo: Memo): void;
  remove(id: string): void;
}
