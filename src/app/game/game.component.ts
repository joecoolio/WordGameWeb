import { Component, Input, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { GameService } from '../game.service';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { faCircleQuestion } from '@fortawesome/free-solid-svg-icons';
import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { WinDialogComponent } from '../win-dialog/win-dialog.component';

@Component({
  selector: 'game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css'],
})
export class GameComponent implements OnInit {
  @Input() gameService: GameService;
  faCircleCheck = faCircleCheck;
  faCircleQuestion = faCircleQuestion;
  faCircleExclamation = faCircleExclamation;
  faSpinner = faSpinner;

  constructor(private dialog: MatDialog) {}

  ngOnInit() {}

  // Test the word (click on the icons)
  // Just send an enter key press
  testWord(index: number) {
    console.log('Icon clicked: ' + index);

    // If the word clicked isn't the selected word, change to it
    if (this.gameService.selectedWord != index) {
      this.gameService.selectedWord = index;
      this.gameService.selectedLetter = 0;
    }
    this.gameService.letterEntered('Enter');
  }

  // Change the highlighted/current cell
  public setSelectedCell(i: number, j: number) {
    this.gameService.setSelectedCell(i, j);
  }

  openDialog() {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;

    dialogConfig.data = {
      id: 1,
      title: 'Angular For Beginners',
    };

    this.dialog.open(WinDialogComponent, dialogConfig);

    const dialogRef = this.dialog.open(WinDialogComponent, dialogConfig);

    dialogRef
      .afterClosed()
      .subscribe((data) => console.log('Dialog output:', data));
  }
}
