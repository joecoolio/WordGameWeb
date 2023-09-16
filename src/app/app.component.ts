import { Component, HostListener, VERSION } from '@angular/core';
import Keyboard from 'simple-keyboard';
import { GameService } from './services/game.service';
import { NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { SettingsComponent } from './settings/settings.component';
import { LoginComponent } from './account/login/login.component';
import { Subscription } from 'rxjs';
import { PlayerService, PlayerStatus } from './services/player.service';
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

  // Capture full screen toggles
  // This is informational only used to keep my variables in sync with reality
  @HostListener('window:resize', ['$event'])
  onResize(event) {
    if (this.isFullscreenNow()) {
      // We just went to fullscreen
      if (!this._fullscreen) {
        // We were previously not fullscreen
        console.log("AppComponent onResize: Fullscreen Off -> On")
        this._fullscreen = true;
        this.eventBusService.emitNotification('fullscreenEnabled', null);
        this.playerService.fullscreen = true;
        // this._value = "Fullscreen: On";
      } else {
        // We were previously fullscreen
        console.log("AppComponent onResize: Fullscreen On -> On")
      }
    } else {
      // We just went to not fullscreen
      if (this._fullscreen) {
        // We were previously fullscreen
        console.log("AppComponent onResize: Fullscreen On -> Off")
        this._fullscreen = false;
        this.eventBusService.emitNotification('fullscreenDisabled', null);
        this.playerService.fullscreen = false;
        // this._value = "Fullscreen: Off";
      } else {
        console.log("AppComponent onResize: Fullscreen Off -> Off")
      }
    }
  }

  name = 'WordHop ' + VERSION.major;

  private _subscriptions: Subscription;

  // _value: string = '';
  private _keyboard: Keyboard;
  private _dialogOpen: boolean;
  private _fullscreen: boolean;

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

    // Check fullscreen status
    this._fullscreen = this.isFullscreenNow();
    console.log("AppComponent: fullscreen initially: ", this._fullscreen);

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

    // Watch for enableFullscreen events to turn on fullscreen
    this._subscriptions.add(this.eventBusService.onCommand('enableFullscreen', () => {
      console.log("AppComponent: fullscreen on requested")
      this.setFullscreen(true);
    }));

    // Watch for disableFullscreen events to turn off fullscreen
    this._subscriptions.add(this.eventBusService.onCommand('disableFullscreen', () => {
      console.log("AppComponent: fullscreen off requested")
      this.setFullscreen(false);
    }));

    // Watch for newGame events to toggle fullscreen
    this._subscriptions.add(this.eventBusService.onCommand('newGame', () => {
      console.log("AppComponent: newGame requested, checking fullscreen")
      this.setFullscreen(playerService.fullscreen);
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

  // Check fullscreen status
  // This has to handle the fullscreen api AND f11.  It's a pita.
  isFullscreenNow(): boolean {
    const windowWidth = window.innerWidth/* * window.devicePixelRatio*/;
    const windowHeight = window.innerHeight/* * window.devicePixelRatio*/;
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    
    return (windowWidth/screenWidth) >= 0.95 && (windowHeight/screenHeight) >= 0.95;
  }

  // Turn on/off fullscreen
  // This fails if the user has not done any inputs yet.
  setFullscreen(turnon: boolean) {
    // Only run if it would change the current fullscreen status
    if (this.isFullscreenNow() != turnon) {
      if (turnon) {
        // Turn on
        if (document.fullscreenElement == null) {
          document.documentElement.requestFullscreen().then(
            // Success  
            () => {
              console.log("AppComponent: Fullscreen turned ON");
            },
            // Failure
            (reason) => {
              console.log("AppComponent: Fullscreen on failed", reason);
            }
          );
        }
      } else {
        // Turn off
        document.exitFullscreen().then(
          // Success  
          () => {
            console.log("AppComponent: Fullscreen turned OFF");
          },
          // Failure
          (reason) => {
            console.log("AppComponent: Fullscreen off failed", reason);
          }
        );
      }
    }
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
    // this._value = input;
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
