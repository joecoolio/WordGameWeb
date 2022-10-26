import { Injectable } from '@angular/core';
import { BehaviorSubject, from, Observable, of, skip, Subscription, takeWhile, tap } from 'rxjs';
import { DataService, SettingsResult } from './data.service';
import { CookieService } from 'ngx-cookie-service';
import { HttpResponse } from '@angular/common/http';
import { AuthService, LoginResult } from './auth.service';
import { TokenService } from './token.service';

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

@Injectable({ providedIn: 'root' })
export class PlayerService {
    // Current player settings
    private _playerInfo : PlayerInfo;

    // Previous player settings (for settings change detection)
    private _previousPlayerInfo : PlayerInfo;

    // Subject for settings changed observer
    private settingsChangesBehaviorSubject: BehaviorSubject<PlayerInfo>;

    // Subscription to the settings changed observer to fire save events
    private _settingsChangedSubscription: Subscription;

    constructor(
        private dataService: DataService,
        private cookieService: CookieService,
        private authService: AuthService,
        private tokenService: TokenService
    ) {
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
        ));
        // .pipe(
        //     tap<PlayerInfo>(
        //         playerInfo => {
        //             this.saveSettings(
        //                 ()=>{ console.log("Settings saved"); },
        //                 (error: string)=>{ console.log("Save settings failed", error); }
        //             )
        //         }
        //     )
        // );
    }

    // Subscribe to get player settings when they change
    private subscribe() {
        if (!this._settingsChangedSubscription) {
            this._settingsChangedSubscription = this.settingsChanged().pipe(skip(1)).subscribe({
                next: (newPlayerInfo) => {
                    // User settings changed
                    console.log("Calling save");
                    this.saveSettings(
                        newPlayerInfo,
                        ()=>{ console.log("Settings saved", newPlayerInfo)},
                        (err)=>{ console.log("Save settings failed", err)}
                    );``
                }
            });
        }
    }

    // Stop listening for player settings changes
    private unsubscribe() {
        if (this._settingsChangedSubscription) {
            this._settingsChangedSubscription.unsubscribe();
            this._settingsChangedSubscription = null;
        }
    }

    register(
        email: string,
        password: string,
        successCallback: () => void,
        failureCallback: (error: string) => void
    ): void {
        this._playerInfo.status = PlayerStatus.LOADING;

        // Login and get settings
        this.authService.register(
            email,
            password
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

                // Run the callback for the UI
                successCallback();
            },
            // Failure
            (err) => {
            // API call for login failed, nothing to be done here
                console.log("Login failed", err);

                this._playerInfo.status = PlayerStatus.NOT_INITIALIZED;

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

                // Run the callback for the UI
                successCallback();
            },
            // Failure
            (err) => {
            // API call for login failed, nothing to be done here
                console.log("Login failed", err);

                this._playerInfo.status = PlayerStatus.NOT_INITIALIZED;

                // Run the callback for the UI
                failureCallback(err);
            }
        );
    }

    getSettings (
        successCallback: () => void,
        failureCallback: (error: string) => void
    ): void {
        this._playerInfo.status = PlayerStatus.LOADING;

        // We're about to overwrite settings so unsubscribe from changes
        this.unsubscribe()

        // Login and get settings
        this.dataService.getSettings()
        .then(
            // Success
            (resp : HttpResponse<SettingsResult>) => {
                let settingsResult: SettingsResult = resp.body;

                this._playerInfo.email = this.tokenService.email ? this.tokenService.email : DEFAULT_EMAIL;
                this._playerInfo.settings.difficultyLevel = settingsResult.difficultyLevel ? settingsResult.difficultyLevel : DEFAULT_DIFFICULTYLEVEL;
                this._playerInfo.settings.enableSounds = settingsResult.enableSounds ? settingsResult.enableSounds : DEFAULT_ENABLESOUNDS;
                this._playerInfo.settings.gameMode = settingsResult.gameMode ? settingsResult.gameMode : DEFAULT_GAMEMODE;
                this._playerInfo.settings.hintType = settingsResult.hintType ? settingsResult.hintType : DEFAULT_HINTTYPE;
                this._playerInfo.settings.name = settingsResult.name ? settingsResult.name : DEFAULT_NAME;
                this._playerInfo.settings.numHops = settingsResult.numHops ? settingsResult.numHops : DEFAULT_NUM_HOPS;
                this._playerInfo.settings.numLetters = settingsResult.numLetters ? settingsResult.numLetters : DEFAULT_NUM_LETTERS;

                this.settingsChangesBehaviorSubject.next(this._playerInfo);

                // Start listening for changes to settings so save can get called
                this.subscribe();

                this._playerInfo.status = PlayerStatus.OK;

                successCallback();
            },
            // Failure
            (err) => {
            // API call for login failed, nothing to be done here
                console.log("Get settings failed", err);

                this._playerInfo.status = PlayerStatus.NOT_INITIALIZED;

                // Run the callback for the UI
                failureCallback(err);
            }
        );
    }

    saveSettings(
        playerInfo: PlayerInfo,
        successCallback: () => void,
        failureCallback: (error: string) => void
    ): void {
        this._playerInfo.status = PlayerStatus.SAVING;

        // Login and get settings
        this.dataService.saveSettings(JSON.stringify(playerInfo.settings))
        .then(
            // Success
            (resp : HttpResponse<void>) => {
                console.log("Settings saved", playerInfo.settings);

                this._playerInfo.status = PlayerStatus.OK;

                successCallback();
            },
            // Failure
            (err) => {
            // API call for login failed, nothing to be done here
                console.log("Save settings failed", err);

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