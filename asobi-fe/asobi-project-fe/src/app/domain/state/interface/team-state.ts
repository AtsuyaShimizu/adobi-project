import { Signal } from '@angular/core';

export interface TeamStateInterface {
  readonly members: Signal<string[]>;
  setMembers(members: string[]): void;
}
