import { Injectable } from '@angular/core';
import { filter, map, Subject, Subscription } from 'rxjs';
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
const DEFAULT_SHOWKEYBOARD: boolean = true;
const DEFAULT_HINTTYPE: HintType = HintType.Basic;
const DEFAULT_NAME: string = "Guest";
const DEFAULT_EMAIL: string = "guest@guest.com";
const DEFAULT_SHOWDEFINITIONS: boolean = true;
const DEFAULT_FULLSCREEN: boolean = false;
const DEFAULT_LANGUAGE: string = "en";

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
    enableSounds: boolean,
    showKeyboard: boolean,
    showDefinitions: boolean,
    fullscreen: boolean,
    language: string,
}

// Set of all player info
export interface PlayerInfo {
    email: string,
    status: PlayerStatus,
    settings: PlayerSettings
}

class EventData {
    name: string;
    value: any;

    constructor(name: string, value: any) {
        this.name = name;
        this.value = value;
    }
}

// Sends: login, loginFailed, register, registerFailed, settingsLoaded, settingsLoadFailed,
//        settingsSaved, settingsSaveFailed, logout
// Receives: getSettings, saveSettings
@Injectable({ providedIn: 'root' })
export class PlayerService {
    // Current player settings
    private _playerInfo : PlayerInfo;

    // Notifications of settings changing get sent here.
    private _settingChangedSubject: Subject<EventData>;

    constructor(
        private dataService: DataService,
        private authService: AuthService,
        private tokenService: TokenService,
        private eventBusService: EventBusService
    ) {
        this._settingChangedSubject = new Subject<EventData>();

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
                enableSounds: DEFAULT_ENABLESOUNDS,
                showKeyboard: DEFAULT_SHOWKEYBOARD,
                showDefinitions: DEFAULT_SHOWDEFINITIONS,
                fullscreen: DEFAULT_FULLSCREEN,
                language: DEFAULT_LANGUAGE,
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

    // Register here to be notified immediately when settings are changed.
    onSettingChange(settingName: string, action: any): Subscription {
        return this._settingChangedSubject.pipe(
            filter((e: EventData) => e.name === settingName),
            map((e: EventData) => e["value"])).subscribe(action);
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
        if (this.tokenService.isLoggedIn) {
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
                    this._playerInfo.settings.showKeyboard = settingsResult ? settingsResult.showKeyboard : DEFAULT_SHOWKEYBOARD;
                    this._playerInfo.settings.showDefinitions = settingsResult ? settingsResult.showDefinitions : DEFAULT_SHOWDEFINITIONS;
                    this._playerInfo.settings.fullscreen = settingsResult ? settingsResult.fullscreen : DEFAULT_FULLSCREEN;
                    this._playerInfo.settings.language = settingsResult ? settingsResult.language : DEFAULT_LANGUAGE;
                    this._playerInfo.status = PlayerStatus.OK;

                    // Tell the game service
                    this.eventBusService.emitNotification('settingsLoaded', null);

                    // User fullscreen settings need to be implemented immediately so go ahead and do that
                    this.eventBusService.emitNotification(this._playerInfo.settings.fullscreen ? 'fullScreenPrefOn' : 'fullScreenPrefOff', null);

                    successCallback();
                },
                // Failure
                (err) => {
                    // API call for settings failed
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
        if (this.tokenService.isLoggedIn) {
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
            this._settingChangedSubject.next(new EventData('email', s));
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
            this._settingChangedSubject.next(new EventData('status', s));
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
            this._settingChangedSubject.next(new EventData('name', s));
            this.eventBusService.emitNotification('settingsChanged', null);
        }
    }

    get numLetters() : number {
        return this._playerInfo.settings.numLetters;
    }
    set numLetters(value: number) {
        let oldval = this._playerInfo.settings.numLetters;
        this._playerInfo.settings.numLetters = value;
        if (oldval != value) {
            this._settingChangedSubject.next(new EventData('numLetters', value));
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
            this._settingChangedSubject.next(new EventData('numHops', value));
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
            this._settingChangedSubject.next(new EventData('gameMode', value));
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
            this._settingChangedSubject.next(new EventData('difficultyLevel', value));
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
            this._settingChangedSubject.next(new EventData('hintType', value));
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
            this._settingChangedSubject.next(new EventData('enableSounds', value));
            this.eventBusService.emitNotification('settingsChanged', null);
        }
   }

    public get showKeyboard(): boolean {
        return this._playerInfo.settings.showKeyboard;
    }
    public set showKeyboard(value: boolean) {
        let oldval = this._playerInfo.settings.showKeyboard;
        this._playerInfo.settings.showKeyboard = value;
        if (oldval != value) {
            this._settingChangedSubject.next(new EventData('showKeyboard', value));
            this.eventBusService.emitNotification('settingsChanged', null);
        }
    }

    public get showDefinitions(): boolean {
        return this._playerInfo.settings.showDefinitions;
    }
    public set showDefinitions(value: boolean) {
        let oldval = this._playerInfo.settings.showDefinitions;
        this._playerInfo.settings.showDefinitions = value;
        if (oldval != value) {
            this._settingChangedSubject.next(new EventData('showDefinitions', value));
            this.eventBusService.emitNotification('settingsChanged', null);
        }
    }

    public get fullscreen(): boolean {
        return this._playerInfo.settings.fullscreen;
    }
    public set fullscreen(value: boolean) {
        let oldval = this._playerInfo.settings.fullscreen;
        this._playerInfo.settings.fullscreen = value;
        if (oldval != value) {
            this._settingChangedSubject.next(new EventData('fullscreen', value));
            this.eventBusService.emitNotification('settingsChanged', null);
            this.eventBusService.emitNotification(value ? 'fullScreenPrefOn' : 'fullScreenPrefOff', null);
        }
    }
    
    public get language(): string {
        return this._playerInfo.settings.language;
    }
    public set language(value: string) {
        let oldval = this._playerInfo.settings.language;
        this._playerInfo.settings.language = value;
        if (oldval != value) {
            this._settingChangedSubject.next(new EventData('language', value));
            this.eventBusService.emitNotification('settingsChanged', null);
        }
    }
}