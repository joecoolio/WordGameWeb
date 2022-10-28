import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs';
import { DataService } from './data.service';
import { EventBusService } from './eventbus.service';
import { GameService } from './game.service';

// Sends: 
// Receives: recordGameStart, recordGameWon, recordGameLost
@Injectable({ providedIn: 'root' })
export class GameTrackerService {
    private _subscriptions: Subscription;

    constructor(
        private gameService: GameService,
        private dataService: DataService,
        private eventBusService: EventBusService
    ) {
        this._subscriptions = new Subscription();
        
        // Watch for game starts
        this._subscriptions.add(this.eventBusService.onCommand('recordGameStart', () => {
            console.log("GameTracker: game started")
            dataService.recordNewGame(
                gameService.gameId,
                gameService.wordPair.startWord + "_" + gameService.wordPair.endWord,
                gameService.numLetters,
                gameService.numHops,
                gameService.gameMode,
                gameService.difficultyLevel
            );
        }));

        // Watch for game won
        this._subscriptions.add(this.eventBusService.onCommand('recordGameWon', () => {
            console.log("GameTracker: game won")
            dataService.recordGameResult(
                gameService.gameId,
                'win',
                gameService.numHintsGiven,
                gameService.gameExecutionMs
            );
        }));

        // Watch for game lost
        this._subscriptions.add(this.eventBusService.onCommand('recordGameLost', () => {
            console.log("GameTracker: game lost")
            dataService.recordGameResult(
                gameService.gameId,
                'loss',
                gameService.numHintsGiven,
                gameService.gameExecutionMs
            );
        }));

        // Watch for game terminated
        this._subscriptions.add(this.eventBusService.onCommand('recordGameAbandon', () => {
            console.log("GameTracker: game abandoned")
            dataService.recordGameResult(
                gameService.gameId,
                'abandon',
                gameService.numHintsGiven,
                gameService.gameExecutionMs
            );
        }));
    }

}
