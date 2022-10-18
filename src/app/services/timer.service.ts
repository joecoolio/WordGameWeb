import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, ReplaySubject, Subscription, takeWhile, tap, timer } from 'rxjs';

// How often to get timer ticks (in ms)
const TICK_TIME = 100;

@Injectable({ providedIn: 'root' })
export class TimerService {

    // Subject for timer
    private _timerSubscription: Subscription;

    // Expiration time of the timer
    private _endTime: number;

    // Remaining time of the timer
    private _remainingTime: number;

    // Subject for countdown callbacks
    private _tickBehaviorSubject: ReplaySubject<number>;

    // Subject for countdown callbacks
    private _finishedBehaviorSubject: ReplaySubject<void>;

    constructor() {
        this.reset();
    }

    reset() {
        this._remainingTime = -1;
        this._tickBehaviorSubject = new ReplaySubject(this._remainingTime);
        this._finishedBehaviorSubject = new ReplaySubject(null);
    }

    // Subscribe to this to see the clock ticking down
    tick(): Observable<number> {
        return this._tickBehaviorSubject
        // .pipe(tap((val) => console.log("Tick val b = " + val)))
        // .pipe(takeWhile((val) => val >= 0))
        // .pipe(tap((val) => console.log("Tick val a = " + val)))
        ;
    }

    finished(): Observable<void> {
        return this._finishedBehaviorSubject
        // .pipe(tap(() => console.log("Running: " + this._timerRunning)))
        // .pipe(takeWhile(() => this._timerRunning))
        ;
    }

    startTimer(timeInMs: number) {
        console.log("Starting the timer at " + timeInMs);
        this._endTime = performance.now() + timeInMs;
        this._remainingTime = -1;

        this._timerSubscription = timer(TICK_TIME, TICK_TIME).subscribe(
            event => {
                this._remainingTime = Math.max(this._endTime - performance.now(), 0);
                if (this._remainingTime > 0) {
                    this._tickBehaviorSubject.next(this._remainingTime);
                } else {
                    this._finishedBehaviorSubject.next();
                    this._timerSubscription.unsubscribe();
                }
            }
        );
    }

    // Turn off the timer
    stopTimer() {
        this._timerSubscription.unsubscribe();
    }

}