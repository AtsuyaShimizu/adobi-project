import { Injectable, inject } from '@angular/core';
import { MemoServiceInterface } from '../interface/memo.service';
import { Memo } from '../../model/memo';
import { MemoState } from '../../state/local/memo.state';

@Injectable({ providedIn: 'root' })
export class MemoService implements MemoServiceInterface {
  #state = inject(MemoState);
  readonly memos = this.#state.memos;

  async add(memo: Memo): Promise<void> {
    this.#state.add(memo);
  }

  async update(memo: Memo): Promise<void> {
    this.#state.update(memo);
  }

  async remove(id: string): Promise<void> {
    this.#state.remove(id);
  }
}
