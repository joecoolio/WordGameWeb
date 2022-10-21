import { Component, HostListener, VERSION } from '@angular/core';
import Keyboard from 'simple-keyboard';
import { GameService } from './services/game.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SettingsComponent } from './settings/settings.component';
import { AccountComponent } from './account/account.component';
import { Subscription } from 'rxjs';

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
    public gameService: GameService,
    private modalService: NgbModal
  ) {
    this._subscriptions = new Subscription();
  }

  openProfile() {
    const modalRef = this.modalService.open(AccountComponent);
  }

  openSettings() {
    const modalRef = this.modalService.open(SettingsComponent);
    modalRef.componentInstance.gameService = this.gameService;
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

    // Force destroy to run
    // Might record abandoned games here?
    window.onbeforeunload = () => this.ngOnDestroy();
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
