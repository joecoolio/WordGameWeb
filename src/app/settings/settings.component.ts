import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { GameService } from '../services/game.service';
import { PlayerService, HintType, GameMode } from '../services/player.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
})
export class SettingsComponent implements OnInit {
  constructor(
    public activeModal: NgbActiveModal,
    public gameService: GameService,
    public playerService: PlayerService
  ) { }

  ngOnInit() { }

  formatDifficulty(value: number) : string {
    switch (value) {
      case 1:
        return "Normal";
      case 2:
        return "Advanced";
      case 3:
        return "Expert";
      case 4:
        return "Insane";
    }
  }

  //////
  // Hint is either basic or whole word - set to false for basic, true for whole word
  //////
  formatHintType(value: number) : boolean {
    if (value == HintType.Basic) {
      return false;
    } else {
      return true;
    }
  }
  setHintType(value: boolean) {
    if (!value) {
      this.playerService.hintType = HintType.Basic;
    } else {
      this.playerService.hintType = HintType.WholeWord;
    }
    // console.log("Setting player hint type to: " + this.playerService.hintType);
  }

  //////
  // Game type is either normal or timed - set to false for normal, true for timed
  //////
  formatGameMode(value: number) : boolean {
    if (value == GameMode.Normal) {
      return false;
    } else {
      return true;
    }
  }
  setGameMode(value: boolean) {
    if (value) {
      this.playerService.gameMode = GameMode.Normal;
    } else {
      this.playerService.gameMode = GameMode.Timed;
    }

    // console.log("Setting player game mode to: " + this.playerService.hintType);
  }

}
