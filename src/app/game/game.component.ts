import { Component, OnInit } from '@angular/core';
import { GameService } from '../game.service';

@Component({
  selector: 'game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css'],
})
export class GameComponent implements OnInit {
  constructor(public gameService: GameService) {}

  ngOnInit() {}

  selectedWord = 0;

  public setSelectedWord(_index: number) {
    this.selectedWord = _index;
  }
}
