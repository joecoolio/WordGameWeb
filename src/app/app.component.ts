import { Component, HostListener, VERSION } from '@angular/core';
import Keyboard from 'simple-keyboard';
import { GameService } from './game.service';
import { AudioService } from './audio.service';
import { faDeleteLeft } from '@fortawesome/free-solid-svg-icons';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SettingsComponent } from './settings/settings.component';

@Component({
  selector: 'wordgame-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  name = 'Angular ' + VERSION.major;

  value = '';
  keyboard: Keyboard;
  faDeleteLeft = faDeleteLeft;

  constructor(
    public gameService: GameService,
    private modalService: NgbModal
  ) {
  }

  openSettings() {
    const modalRef = this.modalService.open(SettingsComponent);
    modalRef.componentInstance.gameService = this.gameService;
  }

  ngAfterViewInit() {
    this.keyboard = new Keyboard({
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

  // Computer keyboard events
  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    // Pass to game
    this.gameService.letterEntered(event.key);
  }

  // Onscreen keyboard events
  onChange = (input: string) => {
    this.value = input;
  };

  onKeyPress = (button: string) => {
    /**
     * If you want to handle the shift and caps lock buttons
     */
    if (button === '{shift}' || button === '{lock}') this.handleShift();

    // Pass to game
    this.gameService.letterEntered(button);
  };

  onInputChange = (event: any) => {
    this.keyboard.setInput(event.target.value);
  };

  handleShift = () => {
    let currentLayout = this.keyboard.options.layoutName;
    let shiftToggle = currentLayout === 'default' ? 'shift' : 'default';

    this.keyboard.setOptions({
      layoutName: shiftToggle,
    });
  };
}
