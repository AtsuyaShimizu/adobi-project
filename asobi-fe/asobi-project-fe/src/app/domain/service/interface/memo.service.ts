import { Signal } from '@angular/core';
import { Memo } from '../../model/memo';

export interface MemoServiceInterface {
  readonly memos: Signal<Memo[]>;
  add(memo: Memo): Promise<void>;
  update(memo: Memo): Promise<void>;
  remove(id: string): Promise<void>;
}
