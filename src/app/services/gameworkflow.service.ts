import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs';
import { EventBusService } from './eventbus.service';
import { TokenService } from './token.service';

/*
 Incoming notifications:
  applicationStart:  Application started (init called on app)
  login:             User logged in
  loginFailed:       User failed to log in
  register:          User registered
  settingsLoaded:    User settings were loaded from remote
  settingsSaved:     User settings were saved to remote
  settingsChanged:   User settings were changed
  newGameRequested:  User requested a new game
  logout:            User logged out
  gameStarted:       Game started
  gameWon:           Game won
  gameLost:          Game lost

 Outgoing commands:
  getSettings:      Load user settings from remote
  saveSettings:     Save user settings
  newGame:          Start a new game
  terminateGame:    Terminate the current game
  showLogin:        Show the login screen
  doLogout:         Do whatever logout processes are needed
  recordGameStart:  Record that a game started
  recordGameWin:    Record that a game was won
  recordGameLoss:   Record that a game was lost

*/
@Injectable({ providedIn: 'root' })
export class GameWorkflowService {
    private _subscriptions: Subscription;

    constructor(
        private eventBusService: EventBusService,
        private tokenService: TokenService
    ) {
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
                if (this.tokenService.isLoggedIn()) {
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
                // Start a game
                this.eventBusService.emitCommand("newGame", null);
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
                this.eventBusService.emitCommand("recordGameStart", null);
            }
        ))
        // Game won
        this._subscriptions.add(this.eventBusService.onNotification(
            'gameWon', () => {
                this.eventBusService.emitCommand("recordGameWon", null);
            }
        ));

        // Game lost
        this._subscriptions.add(this.eventBusService.onNotification(
            'gameLost', () => {
                this.eventBusService.emitCommand("recordGameLost", null);
            }
        ));

    }

}
