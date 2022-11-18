import { Subject, timer } from 'rxjs';

export class Stopwatch {
  private timeElapsed = 0;
  private timer = null;
  private subscription = null;

  private readonly step: number;

  // Subscribe to this to see ticks
  tick = new Subject<number>();

  // Create a timer that ticks every "step" ms
  constructor(step: number) {
    this.timeElapsed = 0;
    this.step = step;
  }

  start() {
    this.timer = timer(this.step, this.step);
    this.subscription = this.timer.subscribe(() => {
      this.timeElapsed = this.timeElapsed + this.step;
      this.tick.next(this.timeElapsed);
    });
  }

  pause() {
    if (this.timer) {
      this.subscription.unsubscribe();
      this.timer = null;
    } else {
      this.start();
    }
  }

  stop() {
    if (this.timer) {
      this.subscription.unsubscribe();
      this.timer = null;
    }
  }

  reset() {
    this.timeElapsed = 0;
    this.tick.next(this.timeElapsed);
  }
}