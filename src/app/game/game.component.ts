import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { fromEvent, Observable, Subscription } from "rxjs";
import { GameService, GameStatus } from '../services//game.service';

import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { faCircleQuestion } from '@fortawesome/free-solid-svg-icons';
import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { faFaceFrown } from '@fortawesome/free-solid-svg-icons';
import { faRepeat } from '@fortawesome/free-solid-svg-icons';
import { faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { faLightbulb } from '@fortawesome/free-solid-svg-icons';
import { faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { faSadTear } from '@fortawesome/free-solid-svg-icons';
import { faClock } from '@fortawesome/free-solid-svg-icons';
import { faPause } from '@fortawesome/free-solid-svg-icons';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { DifficultyLevel, GameMode, PlayerService } from '../services/player.service';
import { Letter, WordStatus } from '../model/board';
import { EventBusService } from '../services/eventbus.service';
import { ConfirmationComponent } from '../confirmation/confirmation.component';
import { Stopwatch } from '../helper/stopwatch';
import { ToastrService } from 'ngx-toastr';
import { ResizedEvent } from 'angular-resize-event';

// How often to get timer ticks (in ms)
const TICK_TIME = 100;

// Sends: newGameRequested, gamePaused
// Receives: newGame, recordGameWon, recordGameLoss, recordGameAbandon, pauseGame, resumeGame
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
  faEyeSlash = faEyeSlash;
  faSadTear = faSadTear;
  faClock = faClock;
  faPause = faPause;

  public enumGameStatus = GameStatus;
  public enumGameMode = GameMode;
  public enumDifficultyLevel = DifficultyLevel;
  public enumWordStatus = WordStatus;

  @ViewChild('gameContainer')
  gameContainer: ElementRef;

  // Stored sizing information from last resize event
  private latestWidth: number;           // Last recorded width of game container div
  private latestHeight: number;          // Last recorded height of game container div
  private latestBottomRowHeight: number; // Last recorded height of bottom row div
  boardWidth: number = 100;    // Width of game board 
  boardHeight: number = 500;   // Height of game board
  wordRowHeight: number = 20;  // Height of a word row
  letterBoxSize: number = 50;  // Size of a letter box
  letterFontSize: number = 10; // Letter font size
  iconFontSize: number = 10;   // Icon font size

  // Subscription Stuff
  private subscriptions: Subscription;

  // True/false showing if the game is paused right now
  paused: boolean;

  // Game timer helper class
  private _stopWatch: Stopwatch;

  // Stuff for catching and dealing with window resizes (to adjust the board's size)
  resizeObservable$: Observable<Event>
 
  // Set to true to do a resize after the next content check
  private _doResize: boolean;

  constructor(
    // private dialog: MatDialog,
    public gameService: GameService,
    private playerService: PlayerService,
    private modalService: NgbModal,
    private eventBusService: EventBusService,
    private cdRef: ChangeDetectorRef,
    private toastr: ToastrService,
  ) {
      this.subscriptions = new Subscription();

      // Watch for logout events to be fired and show the login screen
      this.subscriptions.add(
        this.eventBusService.onCommand('newGame', () => {
          console.log("GameComponent: requested to start new game");
          this.__newGame();
        })
      );

      // Watch for the game to become paused
      this.subscriptions.add(
        this.eventBusService.onCommand('pauseGame', () => {
          console.log("GameComponent: game paused");
          this.pause();
        })
      )
      
      // Watch for the game to become un-paused
      this.subscriptions.add(
        this.eventBusService.onCommand('resumeGame', () => {
          console.log("GameComponent: game resumed");
          this.resume();
        })
      )

      this.subscriptions.add(this.eventBusService.onCommand('recordGameWon', () => {
        console.log("GameComponent: game over (win)");
        this._stopWatch.stop();
      }));
      this.subscriptions.add(this.eventBusService.onCommand('recordGameLoss', () => {
        console.log("GameComponent: game over (lose)");
        this._stopWatch.stop();
        this._stopWatch.reset();
      }));
      this.subscriptions.add(this.eventBusService.onCommand('recordGameAbandon', () => {
        console.log("GameComponent: game over (abandon)");
        this._stopWatch.stop();
      }));
  
      // Setup the stop watch
      this._stopWatch = new Stopwatch(100);
      this.paused = false;

      this._doResize = false;
  }

  // Resize the screen if the keyboard was enabled/disabled
  ngAfterContentChecked() {
    if (this._doResize) {
      this.handleScreenResize();
      this._doResize = false;
      console.log('Game component: resize due to keyboard visibility change');
    }
  }

  formatElapsedTime(time: number): string {
    return '' + (Math.round(time / 10) / 100).toFixed(1);
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    this.resizeObservable$ = fromEvent(window, 'resize')
    this.subscriptions.add(
      this.resizeObservable$.subscribe( evt => {
      // Handle window resize events here
      this.handleScreenResize();
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe()
  }

  getLetterImage(character: string) : string {
    return "../../assets/images/letters/letter_" + character.toLowerCase() + ".png";
  }

  isLetterOnPath(letter: Letter, wordIndex: number, letterIndex: number): boolean {
    const priorLetter: Letter = (wordIndex > 0) ? this.gameService.board.words[wordIndex - 1].letters[letterIndex] : letter;
    // const nextLetter: string = (wordIndex < this.gameService.board.length) ? this.gameService.board[wordIndex + 1].letters[letterIndex] : letterToTest;

    let retval: boolean =
      (letter.character != null && priorLetter.character != null && letter.character.toLowerCase() != priorLetter.character.toLowerCase())
      // || 
      // (nextLetter != null && letterToTest != nextLetter)
    ;

    return retval;
  }

  hintsEnabled() : boolean {
    return (this.gameService.difficultyLevel == DifficultyLevel.Normal);
  }

  formatTimer(timeMs: number): string {
    if (timeMs === undefined) {
      return "";
    }

    if (Math.ceil(timeMs/1000) >= 10) {
      // Display no fractions
      return Math.ceil(timeMs/1000).toString();
    } else {
      return (Math.ceil(timeMs/100) / 10).toFixed(1);
    }
  }

  // Test the word (click on the icons)
  // Just send an enter key press
  testWord(index: number) {
    // If the word clicked isn't the selected word, change to it
    // Not after the game is won or timed out
    if (this.gameService.gameStatus != GameStatus.Lose && this.gameService.gameStatus != GameStatus.Win) {
      if (this.gameService.selectedWord != index) {
        this.gameService.selectedWord = index;
        this.gameService.selectedLetter = 0;
      }
      this.gameService.letterEntered('Enter');
    }
  }

  // Test the entire puzzle
  validatePuzzle() {
    this.gameService.testEntirePuzzle();
  }

  // Give up
  giveUp() {
    if (this.gameService.gameStatus == GameStatus.Run) {
      // A game is already running, get a confirmation before you wipe it out
      const modalRef = this.modalService.open(ConfirmationComponent);
      modalRef.componentInstance.headerText = "Give up?";
      modalRef.componentInstance.messageText = "Are you sure you want to give up? The current incomplete game will be marked as a loss.";
      modalRef.result.then(
        (result: string) => {
          if (result == "yes") {
            console.log("GameComponent: Terminate game requested");
            // Stop the stopwatch if it's running
            this._stopWatch.stop();
            this.eventBusService.emitNotification('gameQuit', null);
          }
        },
        (err) => { /* ignore */ }
      );
    } else {
      // No need for confirmation if the game isn't running
      console.log("GameComponent: Terminate game requested");
      this.eventBusService.emitNotification('gameQuit', null);
    }
  }
  
  // Start over with new words
  newGame() {
    if (this.gameService.gameStatus == GameStatus.Run) {
      // A game is already running, get a confirmation before you wipe it out
      const modalRef = this.modalService.open(ConfirmationComponent);
      modalRef.componentInstance.headerText = "New Game?";
      modalRef.componentInstance.messageText = "Are you sure you want to start a new game? The current incomplete game will be marked as a loss.";
      modalRef.result.then(
        (result: string) => {
          if (result == "yes") {
            console.log("GameComponent: New Game Requested");

            // Stop the stopwatch if it's running
            this._stopWatch.stop();

            // Quit the current game 
            this.eventBusService.emitNotification('gameQuit', null);
            // Request a new game
            this.eventBusService.emitNotification('newGameRequested', null);
          }
        },
        (err) => { /* ignore */ }
      );
    } else {
      // No need for confirmation if the game isn't running
      console.log("GameComponent: New Game Requested");
      this.eventBusService.emitNotification('newGameRequested', null);
    }
  }

  // Actually start the new game, fired by the game state events
  private __newGame() {
    console.log("Game component starting new game");
    let lastNumLetters = this.gameService.numLetters ? this.gameService.numLetters : 0;
    let lastNumHops = this.gameService.numHops ? this.gameService.numHops : 0;
    let lastDifficultlyLevel = this.gameService.difficultyLevel ? this.gameService.difficultyLevel : -1;

    // Disable change detection while the game changes
    this.cdRef.detach();

    this.gameService.newGame()
    .then(
      ()=>{
        console.log("Game initialized correctly");
        console.log("Board: " + this.gameService.board.stringify());

        // Start the stopwatch
        this._stopWatch.reset();
        this._stopWatch.start();
      },
      (error)=>{
        console.log("Game didn't initialize correctly", error);
      }
    )
    .finally(
      // Draw the game regardless of the init status
      ()=>{
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
      }
    );
  }

  pauseButtonPushed() {
    if (!this.paused) {
      // Report that pause was requeted by the user
      console.log("GameComponent: pause requested");
      this.eventBusService.emitNotification('gamePaused', null);
    }
  }

  // Pause the current game
  private pause() {
    if (!this.paused) {
      this.paused = true;
      this._stopWatch.pause();
    }
  }

  // Resume the current game
  private resume() {
    if (this.paused) {
      this.paused = false;
      this._stopWatch.pause();
    }
  }

  // Get a hint for this word
  hint() {
    this.gameService.getHint();
  }

  public get gameTimeElapsed(): number {
    return this._stopWatch.timeElapsed;
  }

  // Change the highlighted/current cell
  public setSelectedCell(i: number, j: number) {
    this.gameService.setSelectedCell(i, j);
  }

  // Game container was resized.  Record the size and do a resize.
  gameContainerResized(event: ResizedEvent) {
    this.latestWidth = event.newRect.width;
    this.latestHeight = event.newRect.height;
    this._doResize = true;
    // console.log("GameComponent game container resize: width/height", this.latestWidth, this.latestHeight);
  }

  // Bottom row was resized.  Record the size and do a resize.
  bottomRowResized(event: ResizedEvent) {
    this.latestBottomRowHeight = event.newRect.height;
    this._doResize = true;
    // console.log("GameComponent bottom row resize: height", this.latestBottomRowHeight);
  }

  // This resets all the various component sizes.
  handleScreenResize() {
    var totWidth = this.latestWidth;
    var totHeight = this.latestHeight - this.latestBottomRowHeight;

    // Calculate number of cells to be drawn horizontal & vertical
    var numHCells = this.gameService.numLetters + 2; // To account for icons on either side
    var numVCells = this.gameService.numHops + 1; // There are 1 more rows than number of hops
    
    // Figure out ideal width/height size of a single letter square cell
    var hSize = totWidth / numHCells;
    var vSize = (totHeight - 2 * numVCells) / numVCells; // The +2 is to account for padding 
    this.letterBoxSize = Math.min(hSize, vSize);
    
    // Calc the size of the board based on cell size
    this.boardWidth =  this.letterBoxSize * numHCells;
    this.boardHeight = this.letterBoxSize * numVCells + (2 * numVCells) + this.latestBottomRowHeight;
  
    // Calc the ideal height of each row
    // this.wordRowHeight = (totHeight - (2 * (numVCells-1))) /numVCells;    
    this.wordRowHeight = this.letterBoxSize;

    // Calc the font size for letters and icons
    this.letterFontSize = this.letterBoxSize * 0.7;
    this.iconFontSize = this.letterBoxSize * 0.5;
  }
}
