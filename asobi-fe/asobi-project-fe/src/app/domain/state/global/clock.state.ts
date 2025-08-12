import { Injectable, signal } from '@angular/core';
import { ClockStateInterface } from '../interface/clock-state';

@Injectable({ providedIn: 'root' })
export class ClockState implements ClockStateInterface {
  #now = signal<string>('');
  readonly now = this.#now.asReadonly();

  setNow(now: string): void {
    this.#now.set(now);
  }
}
