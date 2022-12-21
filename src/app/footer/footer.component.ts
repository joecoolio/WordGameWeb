import { Component, OnInit } from '@angular/core';
import { GameService } from '../services/game.service';
import { PlayerService } from '../services/player.service';
import { TokenService } from '../services/token.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {

  constructor(
    public gameService: GameService,
    public playerService: PlayerService,
    public tokenService: TokenService
  ) { }

  ngOnInit() {
  }

  public get email() : string {
    if (this.playerService.email) {
      if (!this.playerService.email.endsWith("@guestuser.com")) {
        return this.playerService.email;
      } else {
        return "guest";
      }
    } else {
      return "";
    }
  }

}