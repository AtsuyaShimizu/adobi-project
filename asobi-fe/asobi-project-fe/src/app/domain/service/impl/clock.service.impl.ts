import { Injectable, inject } from '@angular/core';
import { ClockServiceInterface } from '../interface/clock.service';
import { ClockState } from '../../state/global/clock.state';

@Injectable({ providedIn: 'root' })
export class ClockService implements ClockServiceInterface {
  #state = inject(ClockState);

  start(): void {
    this.#update();
    setInterval(() => this.#update(), 60000);
  }

  #update(): void {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const formatted = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    this.#state.setNow(formatted);
  }
}
