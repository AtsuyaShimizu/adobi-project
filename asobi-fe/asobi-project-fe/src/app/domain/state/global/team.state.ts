import { Injectable, signal } from '@angular/core';
import { TeamStateInterface } from '../interface/team-state';

@Injectable({ providedIn: 'root' })
export class TeamState implements TeamStateInterface {
  #members = signal<string[]>([]);
  readonly members = this.#members.asReadonly();

  setMembers(members: string[]): void {
    this.#members.set(members);
  }
}
