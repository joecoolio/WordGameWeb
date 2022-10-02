import { Component, Input, OnInit } from '@angular/core';
import { GameService } from '../game.service';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { faCircleQuestion } from '@fortawesome/free-solid-svg-icons';
import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons';

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

  constructor() {}

  ngOnInit() {}

  // Test the word (click on the icons)
  // Just send an enter key press
  testWord(index: number) {
    console.log('Icon clicked: ' + index);
    this.gameService.letterEntered('Enter');
  }

  // Move the highlighted/current cell
  public setSelectedCell(i: number, j: number) {
    this.gameService.selectedWord = i;
    this.gameService.selectedLetter = j;
  }
}
