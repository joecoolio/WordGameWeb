import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

// Type of game the player wants to play
export enum GameMode {
    Normal,   // Normal game
    Timed,    // Timed game
}

// Difficulty levels, increasingly harder
export enum DifficultyLevel {
    Normal,   // Everything is allowed
    Advanced, // Disables hints
    Expert,   // Disables checking each word
    Insane,   // Validation doesn't tell you what's wrong, can only see the changed letters
}

// Type of hint to get
export enum HintType {
    Basic,
    WholeWord
}

// Defaults:
const DEFAULT_NUM_LETTERS: number = 5;
const DEFAULT_NUM_HOPS: number = 5;
const DEFAULT_GAMEMODE: GameMode = GameMode.Normal;
const DEFAULT_DIFFICULTYLEVEL: DifficultyLevel = DifficultyLevel.Normal;
const DEFAULT_HINTTYPE: HintType = HintType.Basic;

// Status of the player settings
export enum PlayerStatus {
    NOT_INITIALIZED,  // Not yet initialized
    LOADING,          // In the process of loading user settings
    SAVING,           // Currently saving user settings
    OK                // Stable, use me now
}
 

@Injectable({ providedIn: 'root' })
export class PlayerService {
    // Status of the service
    private _status: PlayerStatus;

    // User information
    private _userId: string;

    // Parameters of the game
    private _numLetters: number;
    private _numHops: number;
    private _gameMode: GameMode;
    private _difficultyLevel: DifficultyLevel;

    // Hint type
    private _hintType: HintType;

    constructor() {
        this._status = PlayerStatus.NOT_INITIALIZED;
    }

    load(): Observable<boolean> {
        // If the user settings are already loaded, do nothing here
        if (this._status == PlayerStatus.OK) {
            return of(true);
        } else {
            // TODO: This is where user information will be loaded from the db
            // For the time being, just return defaults
            this._status = PlayerStatus.LOADING;

            this._numLetters = DEFAULT_NUM_LETTERS;
            this._numHops = DEFAULT_NUM_HOPS;
            this._gameMode = DEFAULT_GAMEMODE;
            this._difficultyLevel = DEFAULT_DIFFICULTYLEVEL;
            this._hintType = DEFAULT_HINTTYPE

            this._status = PlayerStatus.OK;
            return of(true);
        }
    }

    // Getters and Setters
    public get status(): PlayerStatus {
        return this._status;
    }

    get numLetters() : number {
        return this._numLetters;
    }
    set numLetters(n: number) {
        this._numLetters = n;
    }

    public get numHops(): number {
        return this._numHops;
    }
    public set numHops(value: number) {
        this._numHops = value;
    }

    public get gameMode(): GameMode {
        return this._gameMode;
    }
    public set gameMode(value: GameMode) {
        this._gameMode = value;
    }

    public get difficultyLevel(): DifficultyLevel {
        return this._difficultyLevel;
    }
    public set difficultyLevel(value: DifficultyLevel) {
        this._difficultyLevel = value;
    }

    public get hintType(): HintType {
        return this._hintType;
    }
    public set hintType(value: HintType) {
        this._hintType = value;
    }

}