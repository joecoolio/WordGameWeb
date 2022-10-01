import { Component, Input, OnInit } from '@angular/core';
import { GameService } from '../game.service';

@Component({
  selector: 'game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css'],
})
export class GameComponent implements OnInit {
  @Input() gameService: GameService;

  constructor() {}

  ngOnInit() {}

  public setSelectedCell(i: number, j: number) {
    this.gameService.selectedWord = i;
    this.gameService.selectedLetter = j;
  }
}
