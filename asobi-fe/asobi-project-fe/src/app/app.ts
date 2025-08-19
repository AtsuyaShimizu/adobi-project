import { Component, OnDestroy, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnDestroy {
  protected title = 'asobi-project-fe';
  protected readonly currentDateTime = signal(this.formatDateTime(new Date()));
  private readonly intervalId: ReturnType<typeof setInterval>;

  constructor() {
    this.intervalId = setInterval(() => {
      this.currentDateTime.set(this.formatDateTime(new Date()));
    }, 60 * 1000);
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }

  private formatDateTime(date: Date): string {
    const pad = (value: number) => value.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}
