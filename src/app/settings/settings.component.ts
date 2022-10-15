import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { GameService } from '../game.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
})
export class SettingsComponent implements OnInit {
  gameService: GameService;

  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit() {}

  get numLetters() {
    return this.gameService.numLetters;
  }
  set numLetters(n: number) {
console.log("Setting number of letters: " + n);
    this.gameService.numLetters = n;
  }

  get numHops() {
    return this.gameService.numHops;
  }
  set numHops(n: number) {
    this.gameService.numHops = n;
  }
}
