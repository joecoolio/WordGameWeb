import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { GameService } from '../services/game.service';
import { PlayerService, DifficultyLevel, HintType, GameMode } from '../services/player.service';

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
  ) {
    this.name = playerService.name;
  }

  ngOnInit() { }

  // Name in the input box
  name: string;

  changeName() {
    this.playerService.name = this.name;
  }

  //////
  // Difficulty is an enum
  //////
  getMinDifficulty() : number {
    return DifficultyLevel.Normal;
  }
  getMaxDifficulty() : number {
    return DifficultyLevel.Insane;
  }
  formatDifficulty(value: number) : string {
    switch (value) {
      case DifficultyLevel.Normal:
        return "Normal";
      case DifficultyLevel.Advanced:
        return "Advanced";
      case DifficultyLevel.Expert:
        return "Expert";
      case DifficultyLevel.Insane:
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
      this.playerService.gameMode = GameMode.Timed;
    } else {
      this.playerService.gameMode = GameMode.Normal;
    }

    // console.log("Setting player game mode to: " + this.playerService.hintType);
  }

}
