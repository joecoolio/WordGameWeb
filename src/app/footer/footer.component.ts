import { Component, OnInit } from '@angular/core';
import { GameService } from '../services/game.service';
import { TokenService } from '../services/token.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {

  constructor(
    public gameService: GameService,
    public tokenService: TokenService
  ) { }

  ngOnInit() {
  }

}