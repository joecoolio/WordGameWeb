import { Subject, timer } from 'rxjs';

export class Stopwatch {
  private _timeElapsed = 0;
  private timer = null;
  private subscription = null;

  private readonly step: number;

  // Subscribe to this to see ticks
  tick = new Subject<number>();

  // Create a timer that ticks every "step" ms
  constructor(step: number) {
    this._timeElapsed = 0;
    this.step = step;
  }

  start() {
    this.timer = timer(this.step, this.step);
    this.subscription = this.timer.subscribe(() => {
      this._timeElapsed = this._timeElapsed + this.step;
      this.tick.next(this._timeElapsed);
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
    this._timeElapsed = 0;
    this.tick.next(this._timeElapsed);
  }
  
  public get timeElapsed() {
    return this._timeElapsed;
  }
}