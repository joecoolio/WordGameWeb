import { Component, HostListener, VERSION } from '@angular/core';
import Keyboard from 'simple-keyboard';
import { GameService } from './services/game.service';
import { NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { SettingsComponent } from './settings/settings.component';
import { LoginComponent } from './account/login/login.component';
import { Subscription } from 'rxjs';
import { PlayerService } from './services/player.service';
import { DataService } from './services/data.service';
import { TokenService } from './services/token.service';
import { EventBusService } from './services/eventbus.service';
import { GameWorkflowService } from './services/gameworkflow.service';
import { GameTrackerService } from './services/gametracker.service';
import { LeaderboardComponent } from './account/leaderboard/leaderboard.component';
import { StatsComponent } from './account/stats/stats.component';
import { PregameComponent } from './pregame/pregame.component';
import { WinLoseComponent } from './winlosedialog/winlose.component';
import { PauseComponent } from './pausedialog/pause.component';
import { DictionaryService } from './services/dictionary.service';

// Sends: applicationStart, gameResumed
// Receives: showLogin, showPregame, newGame, recordGameWon, pauseGame
@Component({
  selector: 'wordgame-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  name = 'Angular ' + VERSION.major;

  private _subscriptions: Subscription;

  private _value: string = '';
  private _keyboard: Keyboard;
  private _dialogOpen: boolean;

  constructor(
    public tokenService: TokenService,
    public dataService: DataService,
    public gameService: GameService,
    private modalService: NgbModal,
    public playerService: PlayerService,
    private eventBusService: EventBusService,
    public dictionaryService: DictionaryService,
    // These have to be referenced to get them running
    private gameWorkflowService: GameWorkflowService,
    private gameTrackerService: GameTrackerService
  ) {
    this._subscriptions = new Subscription();

    // Watch for showLogin events to be fired to open the login screen
    this._subscriptions.add(this.eventBusService.onCommand('showLogin', () => {
      console.log("AppComponent: open login requested")
      this.openLogin();
    }));

    // Watch for showPregame events and show the pregame screen
    this._subscriptions.add(this.eventBusService.onCommand('showPregame', () => {
      console.log("AppComponent: show pregame requested")
      this.openPregame();
    }));

    // Watch for newGame and show the keyboard
    this._subscriptions.add(this.eventBusService.onCommand('newGame', () => {
      console.log("AppComponent: game start requested")
      // this.showKeyboard();
    }));

    // Watch for win & lose and show overlay
    this._subscriptions.add(this.eventBusService.onCommand('recordGameWon', () => {
      console.log("AppComponent: game won notification")
      this.openWinLoseDialog();
    }));

    // Watch for pause show overlay
    this._subscriptions.add(this.eventBusService.onCommand('showPauseScreen', () => {
      console.log("AppComponent: show pause screen")
      this.openPauseDialog();
    }));
  }

  ngOnInit() {
    this.showKeyboard();
  }

  showKeyboard() {
    if (!this._keyboard) {
      console.log("AppComponent: creating keyboard")
      
      // Setup the onscreen keyboard
      this._keyboard = new Keyboard({
        onChange: (input) => this.onChange(input),
        onKeyPress: (button) => this.onKeyPress(button),
        layout: {
          default: [
            'Q W E R T Y U I O P',
            'A S D F G H J K L',
            '{enter} Z X C V B N M {bksp}',
          ],
        },
        display: {
          '{bksp}': 'bksp',
          '{enter}': 'enter',
        },
      });
    }
  }

  openLogin() {
    // Show the login/register screen
    const modalRef = this.modalService.open(LoginComponent);
  }

  private openPopup(component, options?: NgbModalOptions) : NgbModalRef {
    // Inform that a popup is open
    this.eventBusService.emitNotification('popupOpened', null);

    // Show the user stats
    const modalRef = this.modalService.open(component, options);
    modalRef.result.then(
      () => {
        // When the window closes, send a resume request
        this.eventBusService.emitNotification('popupClosed', null);
      },
      (err) => {
        // When the window closes, send a resume request
        this.eventBusService.emitNotification('popupClosed', null);
      }
    )

    return modalRef;
  }

  // Show the user stats
  openStats() {
    this.openPopup(StatsComponent);
  }

  // Show the leaderboard screen
  openLeaderboard() {
    this.openPopup(LeaderboardComponent);
  }

  // Show settings
  openSettings() {
    const modalRef = this.openPopup(SettingsComponent);
    modalRef.componentInstance.gameService = this.gameService;
  }

  openPregame() {
    const modalRef = this.modalService.open(PregameComponent);

    modalRef.result.then(
      () => {
        // When the pregame is closed, start a game
        this.eventBusService.emitNotification('preGameComplete', null);
      },
      (err) => {
        // When the pregame is dismissed, start a game
        this.eventBusService.emitNotification('preGameComplete', null);
      }
    )
  }

  openPauseDialog() {
    this.openPopup(PauseComponent, {
      ariaLabelledBy: 'modal-basic-title',
      windowClass: 'transparent-modal-content'
    });
  }

  openWinLoseDialog(showWin: boolean = true) {
    const modalRef = this.modalService.open(WinLoseComponent, {
      ariaLabelledBy: 'modal-basic-title',
      windowClass: 'transparent-modal-content'
    });
  }

  ngAfterViewInit() {
    // Register subscription to the modal service to keep an eye on it
    // When a dialog is open, keystrokes won't be sent to the game
    this._dialogOpen = false;
    let sub: Subscription = this.modalService.activeInstances.subscribe(
      (value) => {
        this._dialogOpen = (value.length > 0);
      }
    );
    this._subscriptions.add(sub);

    // Force destroy to run
    // Might record abandoned games here?
    window.onbeforeunload = () => this.ngOnDestroy();

    // Tell the game state engine that the game has started
    this.eventBusService.emitNotification('applicationStart', null);
  }

  ngOnDestroy() {
    console.log("Destroy called");
    this._subscriptions.unsubscribe();
  }

  // Computer keyboard events
  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    // Pass to game
    if (!this._dialogOpen) {
      this.gameService.letterEntered(event.key);
    }
  }

  // Onscreen keyboard events
  onChange = (input: string) => {
    this._value = input;
  };

  onKeyPress = (button: string) => {
    /**
     * If you want to handle the shift and caps lock buttons
     */
    if (button === '{shift}' || button === '{lock}') this.handleShift();

    // Pass to game
    if (!this._dialogOpen) {
      this.gameService.letterEntered(button);
    }
  };

  onInputChange = (event: any) => {
    this._keyboard.setInput(event.target.value);
  };

  handleShift = () => {
    let currentLayout = this._keyboard.options.layoutName;
    let shiftToggle = currentLayout === 'default' ? 'shift' : 'default';

    this._keyboard.setOptions({
      layoutName: shiftToggle,
    });
  };
}
