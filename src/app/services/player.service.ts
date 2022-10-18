import { Injectable } from '@angular/core';
import { BehaviorSubject, from, Observable, of, takeWhile } from 'rxjs';

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
export const DEFAULT_NUM_LETTERS: number = 5;
export const DEFAULT_NUM_HOPS: number = 5;
export const DEFAULT_GAMEMODE: GameMode = GameMode.Normal;
export const DEFAULT_DIFFICULTYLEVEL: DifficultyLevel = DifficultyLevel.Normal;
export const DEFAULT_HINTTYPE: HintType = HintType.Basic;

// Status of the player settings
export enum PlayerStatus {
    NOT_INITIALIZED,  // Not yet initialized
    LOADING,          // In the process of loading user settings
    SAVING,           // Currently saving user settings
    OK                // Stable, use me now
}

// Set of player settings
export interface PlayerSettings {
    status: PlayerStatus,
    numLetters: number,
    numHops: number,
    gameMode: GameMode,
    difficultyLevel: DifficultyLevel,
    hintType: HintType
}

@Injectable({ providedIn: 'root' })
export class PlayerService {
    // Current player settings
    private _playerSettings : PlayerSettings;

    // Previous player settings (for change detection)
    private _previousSettings : PlayerSettings;

    // Subject for settings changed observer
    private settingsChangesBehaviorSubject: BehaviorSubject<PlayerSettings>;

    constructor() {
        this._previousSettings = {
            status: -1,
            numLetters: -1,
            numHops: -1,
            gameMode: -1,
            difficultyLevel: -1,
            hintType: -1
        }

        this._playerSettings = {
            status: PlayerStatus.NOT_INITIALIZED,
            numLetters: DEFAULT_NUM_LETTERS,
            numHops: DEFAULT_NUM_HOPS,
            gameMode: DEFAULT_GAMEMODE,
            difficultyLevel: DEFAULT_DIFFICULTYLEVEL,
            hintType: DEFAULT_HINTTYPE
        }

        this.settingsChangesBehaviorSubject = new BehaviorSubject(this._playerSettings);
    }

    // Subscribe to this to be notified of player settings being changed
    settingsChanged(): Observable<PlayerSettings> {
        return this.settingsChangesBehaviorSubject.pipe(takeWhile(val =>
            val.status !== this._previousSettings.status
            || val.numLetters !== this._previousSettings.numLetters
            || val.numHops !== this._previousSettings.numHops
            || val.gameMode !== this._previousSettings.gameMode
            || val.difficultyLevel !== this._previousSettings.difficultyLevel
            || val.hintType !== this._previousSettings.hintType
        ));
    }

    // Request that the player is reloaded
    load(): void {
        // If the user settings are already loaded, do nothing here
        this._playerSettings.status = PlayerStatus.LOADING;

        // TODO: This is where user information will be loaded from the db
        // For the time being, just return defaults
        this._playerSettings = {
            status: PlayerStatus.OK,
            numLetters: DEFAULT_NUM_LETTERS,
            numHops: DEFAULT_NUM_HOPS,
            gameMode: DEFAULT_GAMEMODE,
            difficultyLevel: DEFAULT_DIFFICULTYLEVEL,
            hintType: DEFAULT_HINTTYPE
        };
        this.settingsChangesBehaviorSubject.next(this._playerSettings);
    }

    // Getters and Setters
    // The settings fire the subject of the settings observer
    public get status(): PlayerStatus {
        return this._playerSettings.status;
    }
    private set status(s: PlayerStatus) {
        this._previousSettings.status = this._playerSettings.status;
        this._playerSettings.status = s;
        this.settingsChangesBehaviorSubject.next(this._playerSettings);
    }

    get numLetters() : number {
        return this._playerSettings.numLetters;
    }
    set numLetters(n: number) {
        this._previousSettings.numLetters = this._playerSettings.numLetters;
        this._playerSettings.numLetters = n;
        this.settingsChangesBehaviorSubject.next(this._playerSettings);
    }

    public get numHops(): number {
        return this._playerSettings.numHops;
    }
    public set numHops(value: number) {
        this._previousSettings.numHops = this._playerSettings.numHops;
        this._playerSettings.numHops = value;
        this.settingsChangesBehaviorSubject.next(this._playerSettings);
    }

    public get gameMode(): GameMode {
        return this._playerSettings.gameMode;
    }
    public set gameMode(value: GameMode) {
        this._previousSettings.gameMode = this._playerSettings.gameMode;
        this._playerSettings.gameMode = value;
        this.settingsChangesBehaviorSubject.next(this._playerSettings);
    }

    public get difficultyLevel(): DifficultyLevel {
        return this._playerSettings.difficultyLevel;
    }
    public set difficultyLevel(value: DifficultyLevel) {
        this._previousSettings.difficultyLevel = this._playerSettings.difficultyLevel;
        this._playerSettings.difficultyLevel = value;
        this.settingsChangesBehaviorSubject.next(this._playerSettings);
    }

    public get hintType(): HintType {
        return this._playerSettings.hintType;
    }
    public set hintType(value: HintType) {
        this._previousSettings.hintType = this._playerSettings.hintType;
        this._playerSettings.hintType = value;
        this.settingsChangesBehaviorSubject.next(this._playerSettings);
    }

}