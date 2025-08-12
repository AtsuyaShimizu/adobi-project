import { Injectable, signal } from '@angular/core';
import { MemoStateInterface } from '../interface/memo-state';
import { Memo } from '../../model/memo';

@Injectable({ providedIn: 'root' })
export class MemoState implements MemoStateInterface {
  #memos = signal<Memo[]>([]);
  readonly memos = this.#memos.asReadonly();

  add(memo: Memo): void {
    this.#memos.update(memos => [...memos, memo]);
  }

  update(memo: Memo): void {
    this.#memos.update(memos => memos.map(m => m.id === memo.id ? memo : m));
  }

  remove(id: string): void {
    this.#memos.update(memos => memos.filter(m => m.id !== id));
  }
}
