import { Subject, timer } from 'rxjs';

export class Stopwatch {
  private _timeElapsed = 0;
  private timer = null;
  private subscription = null;

  private readonly step: number;

  // Subscribe to this to see ticks
  public tick: Subject<number>;

  // Create a timer that ticks every "step" ms
  constructor(step: number) {
    this._timeElapsed = 0;
    this.step = step;

    this.tick = new Subject<number>();
  }

  protected tickFunction(step: number) {
    this._timeElapsed = this._timeElapsed + this.step;
    this.tick.next(this._timeElapsed);
  }

  public start() {
    this.timer = timer(this.step, this.step);
    this.subscription = this.timer.subscribe(() => this.tickFunction(this.step));
  }

  public pause() {
    if (this.timer) {
      this.subscription.unsubscribe();
      this.timer = null;
    } else {
      this.start();
    }
  }

  public stop() {
    if (this.timer) {
      this.subscription.unsubscribe();
      this.timer = null;
    }
  }

  public reset() {
    this._timeElapsed = 0;
    this.tick.next(this._timeElapsed);
  }
  
  public get timeElapsed() {
    return this._timeElapsed;
  }
}
