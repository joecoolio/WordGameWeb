import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs';
import { EventBusService } from './eventbus.service';
import { TokenService } from './token.service';

/*
 Incoming notifications:
  applicationStart:    Application started (init called on app)
  login:               User logged in
  loginFailed:         User failed to log in
  register:            User registered
  settingsLoaded:      User settings were loaded from remote
  settingsSaved:       User settings were saved to remote
  settingsChanged:     User settings were changed
  newGameRequested:    User requested a new game
  preGameComplete:     Pregame is finished
  logout:              User logged out
  gameStarted:         Game started
  gameWon:             Game won
  gameLost:            Game lost
  gameQuit:            Game quit (give up) [[user request to quit]]
  gameTerminated:      Game was terminated [[system reporting that the game is killed]]
  gamePaused:          Game was paused by user
  gameResumed:         Game was resumed by user
  popupOpened:         A popup window was opened (over the game)
  popupClosed:         A popup window was closed
  authTokenExpired:    User's auth refresh token is expired (need to relogin)

 Outgoing commands:
  getSettings:         Load user settings from remote
  saveSettings:        Save user settings
  showPregame:         Open the pregame screen
  newGame:             Start a new game
  terminateGame:       Terminate the current game
  showLogin:           Show the login screen
  doLogout:            Do whatever logout processes are needed
  recordGameStart:     Record that a game started
  recordGameWon:       Record that a game was won
  recordGameLoss:      Record that a game was lost
  recordGameAbandon:   Record that a game was terminated (give up)
  showPauseScreen:     Open the pause popup screen
  pauseGame:           Do stuff needed for a game pause
  resumeGame:          Do stuff needed for a game resume
  forgetAuthTokens:    Discard all authentication tokens

*/

// This is a structure containing all of the state that the
// workflow engine will house.  There will be a single copy 
// of this only.
interface State {
    gameRunning: boolean,
    gamePaused: boolean
}

@Injectable({ providedIn: 'root' })
export class GameWorkflowService {
    private _subscriptions: Subscription;

    // State of the system
    private _state: State;

    constructor(
        private eventBusService: EventBusService,
        private tokenService: TokenService
    ) {
        // Initial game state
        this._state = {
            gameRunning: false,
            gamePaused: false
        }

        this._subscriptions = new Subscription();
        // Setup monitoring for all the various different notifications that can happen.
        // Make stuff happen when appropriate based on these things
        // Notifications to this service come in on notification channel of the event bus
        // Orders go out on the command channel of the event bus

        // Application was started (view is created)
        this._subscriptions.add(this.eventBusService.onNotification(
            'applicationStart', () => {
                // If the user is already logged in, get settings
                // If not, just show the login screen
                if (this.tokenService.isLoggedIn) {
                    this.eventBusService.emitCommand("getSettings", null);
                } else {
                    this.eventBusService.emitCommand("showLogin", null);
                }
            }
        ));

        // User logged in
        this._subscriptions.add(this.eventBusService.onNotification(
            'login', () => {
                // Get the settings
                this.eventBusService.emitCommand("getSettings", null);
            }
        ));

        // User failed to log in
        this._subscriptions.add(this.eventBusService.onNotification(
            'loginFailed', () => {
                // 
            }
        ));

        // User registered
        this._subscriptions.add(this.eventBusService.onNotification(
            'register', () => {
                // Get the settings
                this.eventBusService.emitCommand("getSettings", null);
            }
        ));

        // User settings were loaded from remote
        this._subscriptions.add(this.eventBusService.onNotification(
            'settingsLoaded', () => {
                // Start pregame
                this.eventBusService.emitCommand("showPregame", null);
            }
        ));
        
        // User settings were saved to remote
        this._subscriptions.add(this.eventBusService.onNotification(
            'settingsSaved', () => {
                // 
            }
        ));

        // User settings were saved to remote
        this._subscriptions.add(this.eventBusService.onNotification(
            'settingsChanged', () => {
                // Save settings
                this.eventBusService.emitCommand("saveSettings", null);
            }
        ));

        // User requested a new game
        this._subscriptions.add(this.eventBusService.onNotification(
            'newGameRequested', () => {
                // Show the pregame screen
                this.eventBusService.emitCommand("showPregame", null);
            }
        ));

        // Pregame is done
        this._subscriptions.add(this.eventBusService.onNotification(
            'preGameComplete', () => {
                // Start a game
                this.eventBusService.emitCommand("newGame", null);
            }
        ));

        // User logged out
        this._subscriptions.add(this.eventBusService.onNotification(
            'logout', () => {
                // Stop any current game
                this.eventBusService.emitCommand("terminateGame", null);

                // Do other logoff housekeeping
                this.eventBusService.emitCommand("doLogout", null);

                // Show the login screen
                this.eventBusService.emitCommand("showLogin", null);
            }
        ));
        
        // Game started
        this._subscriptions.add(this.eventBusService.onNotification(
            'gameStarted', () => {
                this._state.gameRunning = true;
                this._state.gamePaused = false;
                this.eventBusService.emitCommand("recordGameStart", null);
            }
        ))
        // Game won
        this._subscriptions.add(this.eventBusService.onNotification(
            'gameWon', () => {
                this._state.gameRunning = false;
                this._state.gamePaused = false;
                this.eventBusService.emitCommand("recordGameWon", null);
            }
        ));

        // Game lost
        this._subscriptions.add(this.eventBusService.onNotification(
            'gameLost', () => {
                this._state.gameRunning = false;
                this._state.gamePaused = false;
                this.eventBusService.emitCommand("recordGameLoss", null);
            }
        ));

        // Game quit (give up)
        this._subscriptions.add(this.eventBusService.onNotification(
            'gameQuit', () => {
                this._state.gameRunning = false;
                this._state.gamePaused = false;
                this.eventBusService.emitCommand("terminateGame", null);
            }
        ));

        // Game quit (give up)
        this._subscriptions.add(this.eventBusService.onNotification(
            'gameTerminated', () => {
                this._state.gameRunning = false;
                this._state.gamePaused = false;
                this.eventBusService.emitCommand("recordGameAbandon", null);
            }
        ));

        // Game paused
        this._subscriptions.add(this.eventBusService.onNotification(
            'gamePaused', () => {
                if (!this._state.gamePaused) {
                    this._state.gamePaused = true;
                    if (this._state.gameRunning) {
                        this.eventBusService.emitCommand("pauseGame", null);
                    }
                    this.eventBusService.emitCommand("showPauseScreen", null);
                }
            }
        ));
        
        // Game resumed
        this._subscriptions.add(this.eventBusService.onNotification(
            'gameResumed', () => {
                if (this._state.gamePaused) {
                    this._state.gamePaused = false;
                    if (this._state.gameRunning) {
                        this.eventBusService.emitCommand("resumeGame", null);
                    }
                }
            }
        ));

        // A popup was opened (need to pause the game)
        this._subscriptions.add(this.eventBusService.onNotification(
            'popupOpened', () => {
                if (this._state.gameRunning && !this._state.gamePaused) {
                    this._state.gamePaused = true;
                    this.eventBusService.emitCommand("pauseGame", null);
                }
            }
        ));

        // A popup was closed (need to resume the game)
        this._subscriptions.add(this.eventBusService.onNotification(
            'popupClosed', () => {
                if (this._state.gameRunning && this._state.gamePaused) {
                    this._state.gamePaused = false;
                    this.eventBusService.emitCommand("resumeGame", null);
                }
            }
        ));
        
        // Auth token expired, need to re-login
        this._subscriptions.add(this.eventBusService.onNotification(
            'authTokenExpired', () => {
                this.eventBusService.emitCommand("forgetAuthTokens", null);
                this.eventBusService.emitCommand("showLogin", null);
            }
        ));
        
    }

}
