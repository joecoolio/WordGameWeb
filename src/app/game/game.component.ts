import { Component, Input, OnInit } from '@angular/core';
import { GameService } from '../game.service';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { faCircleQuestion } from '@fortawesome/free-solid-svg-icons';
import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css'],
})
export class GameComponent implements OnInit {
  @Input() gameService: GameService;
  faCircleCheck = faCircleCheck;
  faCircleQuestion = faCircleQuestion;
  faCircleExclamation = faCircleExclamation;
  faSpinner = faSpinner;

  constructor() {}

  ngOnInit() {}

  // Test the word (click on the icons)
  // Just send an enter key press
  testWord(index: number) {
    console.log('Icon clicked: ' + index);

    // If the word clicked isn't the selected word, change to it
    if (this.gameService.selectedWord != index) {
      this.gameService.selectedWord = index;
      this.gameService.selectedLetter = 0;
    }
    this.gameService.letterEntered('Enter');
  }

  // Change the highlighted/current cell
  public setSelectedCell(i: number, j: number) {
    this.gameService.setSelectedCell(i, j);
  }
}
