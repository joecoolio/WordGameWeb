import { Subject } from 'rxjs';
import { Stopwatch } from './stopwatch';

export class CountdownTimer extends Stopwatch {
  private _timeRemaining = 0;
 
  // Subscribe to this to be notified of completion
  public finished: Subject<void>;

  // Create a countdown of "totalTime" ms that ticks every "step" ms
  constructor(totalTime: number, step: number) {
    super(step);

    this._timeRemaining = totalTime;
    
    this.finished = new Subject<void>();
  }

  protected tickFunction(step: number) {
    this._timeRemaining -= step;
    this.tick.next(this._timeRemaining);

    if (this._timeRemaining <= 0) {
        // Stop the countdown because we're at 0
        this.stop();

        this.finished.next();
    }
  }

  public reset() {
    super.reset();
    this._timeRemaining = 0;
  }
  
  public get timeRemaining() {
    return this._timeRemaining;
  }
}
