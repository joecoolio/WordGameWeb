import { Injectable } from '@angular/core';
import { BehaviorSubject, from, Observable, of, skip, Subscription, takeWhile, tap } from 'rxjs';
import { DataService, SettingsResult } from './data.service';
import { HttpResponse } from '@angular/common/http';
import { AuthService, LoginResult } from './auth.service';
import { TokenService } from './token.service';
import { EventBusService } from './eventbus.service';

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
const DEFAULT_ENABLESOUNDS: boolean = true;
const DEFAULT_HINTTYPE: HintType = HintType.Basic;
const DEFAULT_NAME: string = "Guest";
const DEFAULT_EMAIL: string = "guest@guest.com";

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

// Sends: login, loginFailed, register, registerFailed, settingsLoaded, settingsLoadFailed,
//        settingsSaved, settingsSaveFailed, logout
// Receives: getSettings, saveSettings
@Injectable({ providedIn: 'root' })
export class PlayerService {
    // Current player settings
    private _playerInfo : PlayerInfo;

    constructor(
        private dataService: DataService,
        private authService: AuthService,
        private tokenService: TokenService,
        private eventBusService: EventBusService
    ) {
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
                enableSounds: DEFAULT_ENABLESOUNDS
            }
        }

        // Watch for getSettings commands and execute them
        this.eventBusService.onCommand('getSettings', () => {
            console.log("PlayerService: get settings requested");
            this.getSettings(() => {},(error: string) => {});
        });

        // Watch for save settings events to be fired and handle them
        this.eventBusService.onCommand('saveSettings', () => {
            console.log("PlayerService: saveSettings requested");
            this.saveSettings(this._playerInfo, ()=>{}, (error: string)=>{});
        });
  
    }

    register(
        email: string,
        password: string,
        applyExpiry: boolean,
        successCallback: () => void,
        failureCallback: (error: string) => void
    ): void {
        this._playerInfo.status = PlayerStatus.LOADING;

        // Login and get settings
        this.authService.register(
            email,
            password,
            applyExpiry
        )
        .then(
            // Success
            (resp : HttpResponse<LoginResult>) => {
                let loginResult: LoginResult = resp.body;
                console.log("Register result", loginResult);

                this.tokenService.token = loginResult.access_token;
                if (loginResult.refresh_token) {
                    this.tokenService.refreshToken =loginResult.refresh_token;
                }

                this._playerInfo.status = PlayerStatus.OK;

                // Tell the game service
                this.eventBusService.emitNotification('register', null);

                // Run the callback for the UI
                successCallback();
            },
            // Failure
            (err) => {
            // API call for login failed, nothing to be done here
                console.log("Login failed", err);

                this._playerInfo.status = PlayerStatus.NOT_INITIALIZED;

                // Tell the game service
                this.eventBusService.emitNotification('registerFailed', null);
                
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
        this._playerInfo.status = PlayerStatus.LOADING;

        // Login and get settings
        this.authService.login(
            email,
            password
        )
        .then(
            // Success
            (resp : HttpResponse<LoginResult>) => {
                let loginResult: LoginResult = resp.body;
                console.log("Login result", loginResult);

                this.tokenService.token = loginResult.access_token;
                if (loginResult.refresh_token) {
                    this.tokenService.refreshToken =loginResult.refresh_token;
                }

                this._playerInfo.status = PlayerStatus.OK;

                // Tell the game service
                this.eventBusService.emitNotification('login', null);

                // Run the callback for the UI
                successCallback();
            },
            // Failure
            (err) => {
            // API call for login failed, nothing to be done here
                console.log("Login failed", err);

                this._playerInfo.status = PlayerStatus.NOT_INITIALIZED;

                // Tell the game service
                this.eventBusService.emitNotification('loginFailed', null);

                // Run the callback for the UI
                failureCallback(err);
            }
        );
    }

    getSettings (
        successCallback: () => void,
        failureCallback: (error: string) => void
    ): void {
        if (this.tokenService.isLoggedIn()) {
            this._playerInfo.status = PlayerStatus.LOADING;

            // // We're about to overwrite settings so unsubscribe from changes
            // this.unsubscribe()

            // Login and get settings
            this.dataService.getSettings()
            .then(
                // Success
                (resp : HttpResponse<SettingsResult>) => {
                    let settingsResult: SettingsResult = resp.body;
                    this._playerInfo.email = this.tokenService.email ? this.tokenService.email : DEFAULT_EMAIL;
                    this._playerInfo.settings.difficultyLevel = settingsResult && settingsResult.difficultyLevel ? settingsResult.difficultyLevel : DEFAULT_DIFFICULTYLEVEL;
                    this._playerInfo.settings.enableSounds = settingsResult ? settingsResult.enableSounds : DEFAULT_ENABLESOUNDS;
                    this._playerInfo.settings.gameMode = settingsResult && settingsResult.gameMode ? settingsResult.gameMode : DEFAULT_GAMEMODE;
                    this._playerInfo.settings.hintType = settingsResult && settingsResult.hintType ? settingsResult.hintType : DEFAULT_HINTTYPE;
                    this._playerInfo.settings.name = settingsResult && settingsResult.name ? settingsResult.name : DEFAULT_NAME;
                    this._playerInfo.settings.numHops = settingsResult && settingsResult.numHops ? settingsResult.numHops : DEFAULT_NUM_HOPS;
                    this._playerInfo.settings.numLetters = settingsResult && settingsResult.numLetters ? settingsResult.numLetters : DEFAULT_NUM_LETTERS;

                    this._playerInfo.status = PlayerStatus.OK;

                    // Tell the game service
                    this.eventBusService.emitNotification('settingsLoaded', null);

                    successCallback();
                },
                // Failure
                (err) => {
                // API call for login failed, nothing to be done here
                    console.log("PlayerService: Get settings failed", err);

                    this._playerInfo.status = PlayerStatus.NOT_INITIALIZED;

                    // Tell the game service
                    this.eventBusService.emitNotification('settingsLoadFailed', null);

                    // Run the callback for the UI
                    failureCallback(err);
                }
            );
        } else {
            console.log("PlayerService: Not getting settings because we're not logged in");
        }
    }

    saveSettings(
        playerInfo: PlayerInfo,
        successCallback: () => void,
        failureCallback: (error: string) => void
    ): void {
        if (this.tokenService.isLoggedIn()) {
            this._playerInfo.status = PlayerStatus.SAVING;

            // Login and get settings
            this.dataService.saveSettings(JSON.stringify(playerInfo.settings))
            .then(
                // Success
                (resp : HttpResponse<void>) => {
                    console.log("PlayerService: Settings saved", playerInfo.settings);

                    this._playerInfo.status = PlayerStatus.OK;

                    // Tell the game service
                    this.eventBusService.emitNotification('settingsSaved', null);

                    successCallback();
                },
                // Failure
                (err) => {
                // API call for login failed, nothing to be done here
                    console.log("PlayerService: Save settings failed", err);

                    // Tell the game service
                    this.eventBusService.emitNotification('settingsSaveFailed', null);

                    // Run the callback for the UI
                    failureCallback(err);
                }
            );
        } else {
            console.log("PlayerService: Not saving settings because we're not logged in");
        }
    }

    // Getters and Setters
    // The settings fire the subject of the settings observer
    public get email(): string {
        return this._playerInfo.email;
    }
    public set email(s: string) {
        let oldval = this._playerInfo.email;
        this._playerInfo.email = s;
        if (oldval != s) {
            this.eventBusService.emitNotification('settingsChanged', null);
        }
    }

    public get status(): PlayerStatus {
        return this._playerInfo.status;
    }
    private set status(s: PlayerStatus) {
        let oldval = this._playerInfo.status;
        this._playerInfo.status = s;
        if (oldval != s) {
            this.eventBusService.emitNotification('settingsChanged', null);
        }
    }

    public get name(): string {
        return this._playerInfo.settings.name;
    }
    public set name(s: string) {
        let oldval = this._playerInfo.settings.name;
        this._playerInfo.settings.name = s;
        if (oldval != s) {
            this.eventBusService.emitNotification('settingsChanged', null);
        }
    }



    get numLetters() : number {
        return this._playerInfo.settings.numLetters;
    }
    set numLetters(n: number) {
        let oldval = this._playerInfo.settings.numLetters;
        this._playerInfo.settings.numLetters = n;
        if (oldval != n) {
            this.eventBusService.emitNotification('settingsChanged', null);
        }
    }

    public get numHops(): number {
        return this._playerInfo.settings.numHops;
    }
    public set numHops(value: number) {
        let oldval = this._playerInfo.settings.numHops;
        this._playerInfo.settings.numHops = value;
        if (oldval != value) {
            this.eventBusService.emitNotification('settingsChanged', null);
        }
    }

    public get gameMode(): GameMode {
        return this._playerInfo.settings.gameMode;
    }
    public set gameMode(value: GameMode) {
        let oldval = this._playerInfo.settings.gameMode;
        this._playerInfo.settings.gameMode = value;
        if (oldval != value) {
            this.eventBusService.emitNotification('settingsChanged', null);
        }
    }

    public get difficultyLevel(): DifficultyLevel {
        return this._playerInfo.settings.difficultyLevel;
    }
    public set difficultyLevel(value: DifficultyLevel) {
        let oldval = this._playerInfo.settings.difficultyLevel;
        this._playerInfo.settings.difficultyLevel = value;
        if (oldval != value) {
            this.eventBusService.emitNotification('settingsChanged', null);
        }
    }

    public get hintType(): HintType {
        return this._playerInfo.settings.hintType;
    }
    public set hintType(value: HintType) {
        let oldval = this._playerInfo.settings.hintType;
        this._playerInfo.settings.hintType = value;
        if (oldval != value) {
            this.eventBusService.emitNotification('settingsChanged', null);
        }
    }

    public get enableSounds(): boolean {
        return this._playerInfo.settings.enableSounds;
    }
    public set enableSounds(value: boolean) {
        let oldval = this._playerInfo.settings.enableSounds;
        this._playerInfo.settings.enableSounds = value;
        if (oldval != value) {
            this.eventBusService.emitNotification('settingsChanged', null);
        }
   }

}