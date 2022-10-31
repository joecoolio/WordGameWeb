import { AfterViewInit, Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DataService, Leader } from 'src/app/services/data.service';
import { GameService } from 'src/app/services/game.service';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.css']
})
export class LeaderboardComponent implements OnInit, AfterViewInit {
  constructor(
    public activeModal: NgbActiveModal,
    private dataService: DataService,
    private gameService: GameService
  ) {
  }

  private letters: number;
  private hops: number;
  private boardName: string;
  public leaders: Leader[];

  ngOnInit() {
  }

  ngAfterViewInit(): void {
    this.getLeaderboard("winpct");
  }

  public formatScore(score: number) {
    if (this.boardName === "fastestwin") {
      return (score / 1000.0) + " secs";
    } else if (this.boardName === "winpct") {
      return (score * 100.0) + "%";
    } else {
      return score.toLocaleString("en-US", { maximumFractionDigits: 0, minimumFractionDigits: 0 } );
    } 
  }

  public getLeaderboard(boardName: string): void {
    this.dataService.getLeaderboard(
      this.gameService.numLetters,
      this.gameService.numHops,
      boardName,
    ).then(
      // Success
      (leaders : Leader[]) => {
        console.log("LeaderboardComponent: Loaded leaders", leaders);

        this.letters = this.gameService.numLetters;
        this.hops = this.gameService.numHops;
        this.boardName = boardName;
    
        this.leaders = leaders;
      },
      // Failure
      (err) => {
        // API call for login failed, nothing to be done here
        console.log("LeaderboardComponent: Load leaders failed", err);
      }
  );;
  }

}
