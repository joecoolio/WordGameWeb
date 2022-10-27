import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs';
import { EventBusService } from './eventbus.service';
import { PlayerService } from './player.service';

// Sends: 
// Receives: recordGameStart, recordGameWon, recordGameLost
@Injectable({ providedIn: 'root' })
export class GameTrackerService {
    private _subscriptions: Subscription;

    constructor(
        private playerService: PlayerService,
        private eventBusService: EventBusService
    ) {
        this._subscriptions = new Subscription();
        
        // Watch for game starts
        this._subscriptions.add(this.eventBusService.onCommand('recordGameStart', () => {
            console.log("GameTracker: game started")
        }));

        // Watch for game won
        this._subscriptions.add(this.eventBusService.onCommand('recordGameWon', () => {
            console.log("GameTracker: game won")
        }));

        // Watch for game lost
        this._subscriptions.add(this.eventBusService.onCommand('recordGameLost', () => {
            console.log("GameTracker: game lost")
        }));
    }

}
