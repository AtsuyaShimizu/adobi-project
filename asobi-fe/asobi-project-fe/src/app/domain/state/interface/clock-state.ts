import { Signal } from '@angular/core';

export interface ClockStateInterface {
  readonly now: Signal<string>;
  setNow(now: string): void;
}
