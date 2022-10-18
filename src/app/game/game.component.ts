import { AfterViewInit, ApplicationRef, ChangeDetectorRef, Component, ElementRef, Input, OnInit, Renderer2, ViewChild } from '@angular/core';
import { fromEvent, Observable, Subscription } from "rxjs";
import { MatDialog } from '@angular/material/dialog';
import { GameService, GameStatus } from '../services//game.service';

import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { faCircleQuestion } from '@fortawesome/free-solid-svg-icons';
import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { faFaceFrown } from '@fortawesome/free-solid-svg-icons';
import { faRepeat } from '@fortawesome/free-solid-svg-icons';
import { faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { faLightbulb } from '@fortawesome/free-solid-svg-icons';
import { DifficultyLevel } from '../services/player.service';

@Component({
  selector: 'game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css'],
})
export class GameComponent implements OnInit, AfterViewInit {
  faCircleCheck = faCircleCheck;
  faCircleQuestion = faCircleQuestion;
  faCircleExclamation = faCircleExclamation;
  faSpinner = faSpinner;
  faFaceFrown = faFaceFrown;
  faRepeat = faRepeat;
  faCircleXmark = faCircleXmark;
  faLightbulb = faLightbulb;

  public enumGameStatus = GameStatus;

  @ViewChild('gameContainer')
  gameContainer: ElementRef;

  // Stored sizing information from last resize event
  boardWidth: number = 100;    // Width of game board 
  boardHeight: number = 500;   // Height of game board
  wordRowHeight: number = 20;  // Height of a word row
  letterBoxSize: number = 50;  // Size of a letter box
  letterFontSize: number = 10; // Letter font size
  iconFontSize: number = 10;   // Icon font size

  // Stuff for catching and dealing with window resizes (to adjust the board's size)
  resizeObservable$: Observable<Event>
  resizeSubscription$: Subscription
 
  // constructor(private dialog: MatDialog, private applicationRef: ApplicationRef, private el: ElementRef) {}
  constructor(
    private dialog: MatDialog,
    public gameService: GameService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
  }

  ngAfterViewInit() {
    this.resizeObservable$ = fromEvent(window, 'resize')
    this.resizeSubscription$ = this.resizeObservable$.subscribe( evt => {
      // Handle window resize events here
      this.handleScreenResize();
    });

    this.newGame();
  }

  ngAfterViewChecked() {
    // This make chrome work at first draw
    // this.handleScreenResize();
  }

  ngOnDestroy() {
    this.resizeSubscription$.unsubscribe()
  }

  hintsEnabled() : boolean {
    return (this.gameService.difficultyLevel == DifficultyLevel.Normal);
  }

  // Test the word (click on the icons)
  // Just send an enter key press
  testWord(index: number) {
    // If the word clicked isn't the selected word, change to it
    if (this.gameService.selectedWord != index) {
      this.gameService.selectedWord = index;
      this.gameService.selectedLetter = 0;
    }
    this.gameService.letterEntered('Enter');
  }

  // Start over with new words
  // Resize the screen if the number of letters or hops changed
  newGame() {
    let lastNumLetters = this.gameService.numLetters;
    let lastNumHops = this.gameService.numHops;
    let lastDifficultlyLevel = this.gameService.difficultyLevel;

    // Disable change detection while the game changes
    this.cdRef.detach();

    this.gameService.newGame().then(()=>{
      // If something changed that would cause a screen resize, do it
      if (
        this.gameService.numLetters != lastNumLetters
        || this.gameService.numHops != lastNumHops
        || this.gameService.difficultyLevel != lastDifficultlyLevel
      ) {
        this.handleScreenResize();
      }

      // Re-enable change detection
      this.cdRef.reattach();
    });
}

  // Get a hint for this word
  hint() {
    this.gameService.getHint();
  }

  // Change the highlighted/current cell
  public setSelectedCell(i: number, j: number) {
    this.gameService.setSelectedCell(i, j);
  }

  handleScreenResize() {
    // When the screen resizes, gather all the various sizing information

    // Record the board size (w & h) and font size of letters & icons
    var totWidth = this.gameContainer.nativeElement.offsetWidth;
    var totHeight = this.gameContainer.nativeElement.offsetHeight;

    // Calculate number of cells to be drawn horizontal & vertical
    var numHCells = this.gameService.numLetters + 2; // To account for icons on either side
    var numVCells = this.gameService.numHops + 1; // There are 1 more rows than number of hops

    // Adjust horizontal cells based on game settings
    if (this.gameService.difficultyLevel >= DifficultyLevel.Advanced) {
      numHCells--; // Hints are disabled so that column is gone
    }
    
    // Figure out ideal width/height size of a single letter square cell
    var hSize = totWidth / numHCells;
    var vSize = (totHeight - 2 * (numVCells-1)) / numVCells; // The +2 is to account for padding 
    this.letterBoxSize = Math.min(hSize, vSize);
    
    // Calc the size of the board based on cell size
    this.boardWidth =  this.letterBoxSize * numHCells;
    this.boardHeight = this.letterBoxSize * numVCells + (2 * (numVCells-1));
  
    // Calc the ideal height of each row
    // this.wordRowHeight = (totHeight - (2 * (numVCells-1))) /numVCells;    
    this.wordRowHeight = this.letterBoxSize;

    // Calc the font size for letters and icons
    this.letterFontSize = this.letterBoxSize * 0.7;
    this.iconFontSize = this.letterBoxSize * 0.5;

    console.log("tw: " + totWidth + " / " + totHeight);
    // console.log("bh: " + this.boardHeight + " / " + (this.wordRowHeight * numVCells) + " / " + this.letterBoxSize);
  }
}
