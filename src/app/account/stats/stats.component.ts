import { AfterViewInit, Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DataService, Leader, PlayerStats } from 'src/app/services/data.service';
import { GameService } from 'src/app/services/game.service';


@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css']
})
export class StatsComponent implements OnInit, AfterViewInit {
  constructor(
    public activeModal: NgbActiveModal,
    private dataService: DataService,
    private gameService: GameService
  ) {
    this.getStats();
  }

  stats: PlayerStats[];

  public formatTime(timeMs: number) {
    return (timeMs / 1000.0) + " secs";
  }

  ngOnInit() {
  }

  ngAfterViewInit(): void {
  }

  public getStats(): void {
    this.dataService.getStats(
    ).then(
      // Success
      (stats : PlayerStats[]) => {
        console.log("StatsComponent: Loaded stats", stats);

        this.stats = stats;
      },
      // Failure
      (err) => {
        // API call for login failed, nothing to be done here
        console.log("StatsComponent: Load stats failed", err);
      }
  );;
  }

}
