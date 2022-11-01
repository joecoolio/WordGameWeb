import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription, timer } from 'rxjs';
import { faCirclePlay, fa0, fa1, fa2, fa3, IconDefinition } from '@fortawesome/free-solid-svg-icons';

// How often to get timer ticks (in ms)
const TICK_TIME = 100;

@Component({
  selector: 'app-pregame',
  templateUrl: './pregame.component.html',
  styleUrls: ['./pregame.component.css'],
})
export class PregameComponent implements OnInit, OnDestroy {
  constructor(public activeModal: NgbActiveModal) {
    this.countdownMs = 3000;
  }
  ngOnInit() {
    this.iconToShow = faCirclePlay;
  }

  ngOnDestroy(): void {
    // Make sure subscriptions get cleaned up
    this.stopTimer();
  }

  // Subject for timer
  private _timerSubscription: Subscription;

  // Icon to show is one of the above
  iconToShow: IconDefinition;

  private countdownMs: number;

  // Run a 3 second countdown timer
  startCountdown() {
    // In case anyone is click happy
    if (this._timerSubscription != undefined) {
      return;
    }

    console.log("PregameComponent: Starting countdown timer at " + this.countdownMs);
    let endTime = performance.now() + this.countdownMs;
    let remainingTime = -1;

    this._timerSubscription = timer(0, TICK_TIME).subscribe(
      event => {
          remainingTime = Math.max(endTime - performance.now(), 0);
          if (remainingTime > 0) {
              if (remainingTime > 2000) this.iconToShow = fa3;
              else if (remainingTime > 1000) this.iconToShow = fa2;
              else this.iconToShow = fa1;
          } else {
              this.iconToShow = fa0;
              this.stopTimer();
              this.activeModal.close();
          }
      }
    );
  }

  // Turn off the timer
  stopTimer() {
    if (this._timerSubscription != undefined) {
      this._timerSubscription.unsubscribe();
      this._timerSubscription = undefined;
    }
  }

}
