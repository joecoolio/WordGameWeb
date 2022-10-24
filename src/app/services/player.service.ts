import { Injectable } from '@angular/core';
import { BehaviorSubject, from, Observable, of, takeWhile, tap } from 'rxjs';
import { DataService, LoginResult } from './data.service';
import { CookieService } from 'ngx-cookie-service';
import { HttpResponse } from '@angular/common/http';

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

export interface PlayerSettings {
    name: string,
    numLetters: number,
    numHops: number,
    gameMode: GameMode,
    difficultyLevel: DifficultyLevel,
    hintType: HintType,
    enableSounds: boolean
}

// Set of all player info
export interface PlayerInfo {
    email: string,
    status: PlayerStatus,
    settings: PlayerSettings
}

@Injectable({ providedIn: 'root' })
export class PlayerService {
    // Current player settings
    private _playerInfo : PlayerInfo;

    // Previous player settings (for settings change detection)
    private _previousPlayerInfo : PlayerInfo;

    // Subject for settings changed observer
    private settingsChangesBehaviorSubject: BehaviorSubject<PlayerInfo>;

    constructor(private dataService: DataService, private cookieService: CookieService) {
        if (cookieService.check('email')) {
            let x = cookieService.get('email');
            console.log("Stored email", x);
        }


        this._previousPlayerInfo = {
            email: null,
            status: PlayerStatus.NOT_INITIALIZED,
            settings: {
                name: "",
                numLetters: -1,
                numHops: -1,
                gameMode: -1,
                difficultyLevel: -1,
                hintType: -1,
                enableSounds: false
            }
        }

        this._playerInfo = {
            email: null,
            status: PlayerStatus.NOT_INITIALIZED,
            settings: {
                name: "",
                numLetters: DEFAULT_NUM_LETTERS,
                numHops: DEFAULT_NUM_HOPS,
                gameMode: DEFAULT_GAMEMODE,
                difficultyLevel: DEFAULT_DIFFICULTYLEVEL,
                hintType: DEFAULT_HINTTYPE,
                enableSounds: true
            }
        }

        this.settingsChangesBehaviorSubject = new BehaviorSubject(this._playerInfo);
    }

    // Subscribe to this to be notified of player settings being changed
    settingsChanged(): Observable<PlayerInfo> {
        return this.settingsChangesBehaviorSubject.pipe(takeWhile(val =>
            val.email !== this._previousPlayerInfo.email
            || val.settings.name !== this._previousPlayerInfo.settings.name
            || val.settings.numLetters !== this._previousPlayerInfo.settings.numLetters
            || val.settings.numHops !== this._previousPlayerInfo.settings.numHops
            || val.settings.gameMode !== this._previousPlayerInfo.settings.gameMode
            || val.settings.difficultyLevel !== this._previousPlayerInfo.settings.difficultyLevel
            || val.settings.hintType !== this._previousPlayerInfo.settings.hintType
            || val.settings.enableSounds !== this._previousPlayerInfo.settings.enableSounds
        ))
        .pipe(tap(console.log))
        // TODO - save settings here
        ;
    }

    // Request that the player is reloaded
    load(): void {
        // If the user settings are already loaded, do nothing here
        this._playerInfo.status = PlayerStatus.LOADING;

        // Get settings out of local storage if they are available
        let email = localStorage.getItem('email');
        let settings = localStorage.getItem('settings');
        if (email != null && settings != null) {
            this._playerInfo = {
                email: email,
                status: PlayerStatus.OK,
                settings: JSON.parse(settings)
            }
            this.settingsChangesBehaviorSubject.next(this._playerInfo);
        } else {
            // TODO fire login somehow

            // TODO: This is where user information will be loaded from the db
            // For the time being, just return defaults
            this._playerInfo = {
                email: null,
                status: PlayerStatus.OK,
                settings: {
                    name: "",
                    numLetters: DEFAULT_NUM_LETTERS,
                    numHops: DEFAULT_NUM_HOPS,
                    gameMode: DEFAULT_GAMEMODE,
                    difficultyLevel: DEFAULT_DIFFICULTYLEVEL,
                    hintType: DEFAULT_HINTTYPE,
                    enableSounds: true
                }
            };
            this.settingsChangesBehaviorSubject.next(this._playerInfo);
        }
    }

    register(
        email: string,
        password: string,
        successCallback: () => void,
        failureCallback: (error: string) => void
    ): void {
        this._playerInfo.status = PlayerStatus.SAVING;

        // Get all the possible solutions so we can show the user why they lose
        this.dataService.register(
            email,
            password,
            JSON.stringify(this._playerInfo.settings)
        )
        .then(
            // Success
            (resp : HttpResponse<LoginResult>) => {
                let loginResult: LoginResult = resp.body;
                console.log("Registration result", loginResult);
                if (loginResult.result) {
                    console.log("Registration succeeded", loginResult.email);

                    // Grab the results
                    this._playerInfo.email = loginResult.email;
                    this._playerInfo.status = PlayerStatus.OK;
                    this._playerInfo.settings = JSON.parse(loginResult.settings);
                    this.settingsChangesBehaviorSubject.next(this._playerInfo);

                    // Save stuff locally for later
                    localStorage.setItem('email', loginResult.email);
                    localStorage.setItem('jwt', resp.headers.get('Authorization'));
                    localStorage.setItem('settings', loginResult.settings);

                    // Run the callback for the UI
                    successCallback();
                } else {
                    console.log("Registration failed", loginResult.error);

                    // Run the callback for the UI
                    failureCallback(loginResult.error);
                }
            },
            // Failure
            (err) => {
            // API call for solutions failed, nothing to be done here
                console.log("Register failed", err);

                // Run the callback for the UI
                failureCallback(err);
            }
        );
    }

    login(
        email: string,
        password: string,
        successCallback: () => void,
        failureCallback: (error: string) => void
    ): void {
        this._playerInfo.status = PlayerStatus.SAVING;

        // Login and get settings
        this.dataService.login(
            email,
            password
        )
        .then(
            // Success
            (resp : HttpResponse<LoginResult>) => {
                let loginResult: LoginResult = resp.body;
                console.log("Login result", loginResult);
                if (loginResult.result) {
                    console.log("Login succeeded", loginResult.email);

                    // Grab the results
                    this._playerInfo.email = loginResult.email;
                    this._playerInfo.status = PlayerStatus.OK;
                    this._playerInfo.settings = JSON.parse(loginResult.settings);
                    this.settingsChangesBehaviorSubject.next(this._playerInfo);

                    // Save the email in a cookie for the next time
                    localStorage.setItem('email', loginResult.email);
                    localStorage.setItem('jwt', resp.headers.get('Authorization'));
                    localStorage.setItem('settings', loginResult.settings);

                    // Run the callback for the UI
                    successCallback();
                } else {
                    console.log("Login failed", loginResult.error);

                    // Run the callback for the UI
                    failureCallback(loginResult.error);
                }
            },
            // Failure
            (err) => {
            // API call for login failed, nothing to be done here
                console.log("Login failed", err);

                // Run the callback for the UI
                failureCallback(err);
            }
        );
    }

    // Getters and Setters
    // The settings fire the subject of the settings observer
    public get email(): string {
        return this._playerInfo.email;
    }
    public set email(s: string) {
        this._previousPlayerInfo.email = this._playerInfo.email;
        this._playerInfo.email = s;
        this.settingsChangesBehaviorSubject.next(this._playerInfo);
    }

    public get status(): PlayerStatus {
        return this._playerInfo.status;
    }
    private set status(s: PlayerStatus) {
        this._previousPlayerInfo.status = this._playerInfo.status;
        this._playerInfo.status = s;
        this.settingsChangesBehaviorSubject.next(this._playerInfo);
    }

    public get name(): string {
        return this._playerInfo.settings.name;
    }
    public set name(s: string) {
        this._previousPlayerInfo.settings.name = this._playerInfo.settings.name;
        this._playerInfo.settings.name = s;
        this.settingsChangesBehaviorSubject.next(this._playerInfo);
    }



    get numLetters() : number {
        return this._playerInfo.settings.numLetters;
    }
    set numLetters(n: number) {
        this._previousPlayerInfo.settings.numLetters = this._playerInfo.settings.numLetters;
        this._playerInfo.settings.numLetters = n;
        this.settingsChangesBehaviorSubject.next(this._playerInfo);
    }

    public get numHops(): number {
        return this._playerInfo.settings.numHops;
    }
    public set numHops(value: number) {
        this._previousPlayerInfo.settings.numHops = this._playerInfo.settings.numHops;
        this._playerInfo.settings.numHops = value;
        this.settingsChangesBehaviorSubject.next(this._playerInfo);
    }

    public get gameMode(): GameMode {
        return this._playerInfo.settings.gameMode;
    }
    public set gameMode(value: GameMode) {
        this._previousPlayerInfo.settings.gameMode = this._playerInfo.settings.gameMode;
        this._playerInfo.settings.gameMode = value;
        this.settingsChangesBehaviorSubject.next(this._playerInfo);
    }

    public get difficultyLevel(): DifficultyLevel {
        return this._playerInfo.settings.difficultyLevel;
    }
    public set difficultyLevel(value: DifficultyLevel) {
        this._previousPlayerInfo.settings.difficultyLevel = this._playerInfo.settings.difficultyLevel;
        this._playerInfo.settings.difficultyLevel = value;
        this.settingsChangesBehaviorSubject.next(this._playerInfo);
    }

    public get hintType(): HintType {
        return this._playerInfo.settings.hintType;
    }
    public set hintType(value: HintType) {
        this._previousPlayerInfo.settings.hintType = this._playerInfo.settings.hintType;
        this._playerInfo.settings.hintType = value;
        this.settingsChangesBehaviorSubject.next(this._playerInfo);
    }

    public get enableSounds(): boolean {
        return this._playerInfo.settings.enableSounds;
    }
    public set enableSounds(value: boolean) {
        this._previousPlayerInfo.settings.enableSounds = this._playerInfo.settings.enableSounds;
        this._playerInfo.settings.enableSounds = value;
        this.settingsChangesBehaviorSubject.next(this._playerInfo);
    }

}