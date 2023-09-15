import { AfterViewInit, Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DataService, Leader, PlayerStats } from '../../services/data.service';
import { GameService } from '../../services/game.service';


@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css']
})
export class StatsComponent implements OnInit, AfterViewInit {
  constructor(
    public activeModal: NgbActiveModal,
    private dataService: DataService,
    public gameService: GameService
  ) {
    this.getStats();
  }

  stats: PlayerStats[];

  public formatTime(timeMs: number) {
    return (Math.round(timeMs / 10.0) / 100) + "s";
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
