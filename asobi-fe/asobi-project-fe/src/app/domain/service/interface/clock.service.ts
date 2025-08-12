import { Signal } from '@angular/core';

export interface ClockServiceInterface {
  readonly now: Signal<string>;
  start(): void;
}
