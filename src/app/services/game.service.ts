import { Injectable } from '@angular/core';
import { DataService, WordPair, TestedWord, BasicHint, WholeWordHint, SolutionSet, ValidatedPuzzle } from './data.service';
import { AudioService } from './audio.service';
import { PlayerService, GameMode, HintType, DifficultyLevel} from './player.service';
import { BehaviorSubject, skip, Subject, Subscription, timer } from 'rxjs';
import { Board, WordStatus } from '../model/board';
import { EventBusService } from './eventbus.service';
import { Stopwatch } from '../helper/stopwatch';
import { CountdownTimer } from '../helper/countdowntimer';
import { DictionaryService, DictionaryWord } from './dictionary.service';
import { ToastrService } from 'ngx-toastr';
import { DefinitionToast } from '../game-toast/definition-toast.component';

export enum GameStatus {
  Initialize,  // The game isn't setup yet
  Run,         // The game is running
  Win,         // You win!
  Broken,      // Something is borked
  Lose      // Timed mode & time is up, you lose sucka
}


// Sends: gameStarted, gameWon, gameLost, gameTerminated
// Receives: logout, terminateGame
@Injectable({ providedIn: 'root' })
export class GameService {
  // Min & max number of letters & hops
  readonly MIN_LETTERS: number = 3;
  readonly MAX_LETTERS: number = 6;
  readonly MIN_HOPS: number = 2;
  readonly MAX_HOPS: number = 6;

  // The game board
  private _board: Board;

  // Status of the game:  run, win, broken, initialize
  private _gameStatus: GameStatus = GameStatus.Initialize;

  // Parameters of the current game
  private _gameId: string;
  private _numLetters: number;
  private _numHops: number;
  private _gameMode: GameMode;
  private _difficultyLevel: DifficultyLevel;
  private _hintType: HintType;
  private _numHintsGiven: number;
  
  // To calculate game duration
  private _stopwatch: Stopwatch;

  // Countdown for timed game
  private _countdowntimer: CountdownTimer;

  // Selected row/cell indexes
  private _selectedWord: number = 1;
  private _selectedLetter: number = 0;

  // Message back from the validation routines
  private _message: string = '';

  // Message showing how many solutions there are
  private _solutionMessage: string = '';

  // Execution time of the last api call
  private _lastExecutionTime: number = 0; // Round trip execution

  // Timer subscriptions for timed game
  private _timeRemaining: number;
  private _timeExpired: boolean = false;

  // Subjects for idle timer
  private _idleResetSubject: Subject<void>; // pings when the idle time counter should reset at 0
  private _idleTimeExpiredSubject: Subject<void>; // pings when the idle time exceeds 3s
  private _idleTimerSubscription: Subscription; // handles the idle timer itself

  // All service level subscriptions
  private _subscriptions: Subscription;

  // Everything in here should be unsubscribed at the start of every game
  private _perGameSubscriptions: Subscription;

  // Word pair for the game
  private _wordPair: WordPair;

  constructor(
    private _dataService: DataService,
    private _audioService: AudioService,
    private _playerService: PlayerService,
    private _eventBusService: EventBusService,
    private _dictionaryService: DictionaryService,
    private toastr: ToastrService)
  {
    this._subscriptions = new Subscription();

    // Watch for logout events to be fired and handle them
    this._subscriptions.add(this._eventBusService.onCommand('logout', () => {
      this.logoutOccurred();
    }));

    // Watch for logout events to be fired and handle them
    this._subscriptions.add(this._eventBusService.onCommand('terminateGame', () => {
      this.terminate();
    }));
    
    // Setup the per game subscriptions
    this._perGameSubscriptions = new Subscription();

    // Idle timer stuff
    this._idleResetSubject = new BehaviorSubject<void>(null);
    this._idleTimeExpiredSubject = new BehaviorSubject<void>(null);

    // Create a stopwatch
    this._stopwatch = new Stopwatch(10);

    // Watch for the game to become paused
    this._subscriptions.add(
      this._eventBusService.onCommand('pauseGame', () => {
        console.log("GameService: game paused");
        this._stopwatch.pause();
        if (this._countdowntimer) {
          this._countdowntimer.pause();
        }
      })
    );
    
    // Watch for the game to become un-paused
    this._subscriptions.add(
      this._eventBusService.onCommand('resumeGame', () => {
        console.log("GameService: game resumed");
        this._stopwatch.pause();
        if (this._countdowntimer) {
          this._countdowntimer.pause();
        }
      })
    );
  }

  // Runs when a logout occurs
  private logoutOccurred(): void {
    // End/give up the current game
    // TODO
  }

  // Create a new game
  public async newGame() : Promise<void> {
    // Reset anything required from the previous game
    console.log("Unsubscribing from per-game subscriptions");
    this._perGameSubscriptions.unsubscribe();
    this._perGameSubscriptions = new Subscription();    

    this._gameStatus = GameStatus.Initialize;

    // Once you have player settings, you can create a game
    return new Promise((resolve, reject) => {
      // Reset game parameters to the user's preferences
      this._gameId = crypto.randomUUID();
      this._numLetters = this._playerService.numLetters;
      this._numHops = this._playerService.numHops;
      this._gameMode = this._playerService.gameMode;
      this._difficultyLevel = this._playerService.difficultyLevel;
      this._hintType = this._playerService.hintType;
      this._numHintsGiven = 0;
      this._solutionMessage = '';

      console.log(
        'Initialize new game: letters = ' + this._numLetters + ' / hops = ' + this._numHops +
          " mode = " + this._gameMode
      );

      console.log('Requesting word pair...');

      // Setup a new board
      this._board = new Board(this._numLetters, this._numHops);
      this._message = 'Requesting a pair of words...';
      // Show a toast
      this.toastr.info('Requesting a pair of words...', null, {
        disableTimeOut: true
      });
      
      var execStartTime = performance.now();

      // Flag puzzle as loading
      this._board.setPairWordStatus(WordStatus.Loading);

      this._dataService
        .getPair(this._numLetters, this._numHops)
        .then(
          // Success
          (wordpair: WordPair) => {
            this._wordPair = { ...wordpair };
            this._lastExecutionTime = performance.now() - execStartTime;

            console.log('Got wordpair: ' + JSON.stringify(this._wordPair));
            this._board.initialize(this._wordPair.startWord, this._wordPair.endWord);
            this._message = '';
            this.toastr.clear();

            // Show the definition of the word
            // End word first so it's on the bottom
            // 8 seconds since there are 2 words
            this.showDefinition(this._wordPair.endWord, 8000);
            this.showDefinition(this._wordPair.startWord, 8000);

            // Reset the current word/cell to the top
            this._selectedWord = 1;
            this._selectedLetter = 0;

            // The game is ready, start the timer if needed
            this.startTimer();

            // Start monitoring the idle timer and handle the internal timer
            this.monitorIdleTimer();

            // Watch for idle expiration and ask for number of solutions
            this._perGameSubscriptions.add(
              this._idleTimeExpiredSubject.pipe(skip(1)).subscribe(() => this.idleTimeExpired())
            );

            // Reset/start the stopwatch
            this._stopwatch.reset();
            this._stopwatch.start();
            
            // The game is now running
            this._gameStatus = GameStatus.Run;

            // Tell the game service that the game started
            this._eventBusService.emitNotification('gameStarted', null);

            resolve();
          },
          // Failure
          (err) => {
            // An error happened trying to get words
            console.log("error", err);

            // The game is broken
            this._gameStatus = GameStatus.Broken;

            // The words are no longer loading
            this._board.setPairWordStatus(WordStatus.Broken);

            // Show a message
            if (err.error) {
              this._message = err.error;
              // Show a toast
              this.toastr.clear();
              this.toastr.info(err.error, null, {
                timeOut: 2000
              });
            } else {
              this._message =
                'Failed to communicate with the server, please try again later.';
              // Show a toast
              this.toastr.clear();
              this.toastr.info('Failed to communicate with the server, please try again later.', null, {
                timeOut: 2000
              });
            }

            console.log('Error getting words: ' + JSON.stringify(err));

            reject();
          }
        );
      
    });
  }

  // Start the timer for a timed game
  private startTimer() {
    // If it's a timed game, start the counter
    if (this._gameMode == GameMode.Timed) {
      this._timeExpired = false;

      // Allocate 10 seconds per word to fill in
      let timeS = 10 * (this._numHops - 1);

      // Stop the timer if it's already running
      if (this._countdowntimer) {
        this._countdowntimer.stop();
      }

      // Create the countdown timer for the game
      this._countdowntimer = new CountdownTimer(timeS * 1000, 100);

      // Register subscriptions for the timer
      this._perGameSubscriptions.add(
        this._countdowntimer.tick.subscribe({
          next: (msRemaining) => {
            // console.log("Tick: " + msRemaining);
            this._timeRemaining = msRemaining;
            
            // Play sounds every second until 8.0.
            if (msRemaining > 10000) {
              if (Math.ceil(msRemaining/100) % 10 == 0) {
                this._audioService.clockTick();
              }
            // From 10 to 5 seconds, every 1/2 second
            } else {
              if (msRemaining > 5000) {
                if (Math.ceil(msRemaining/100) % 5 == 0) {
                  this._audioService.clockTick();
                }
              } else {
                // From 5 to 0 seconds, every other tick
                if (Math.ceil(msRemaining/100) % 2 == 0) {
                  this._audioService.clockTick();
                }
              }
            }
          }
        })
      );

      this._perGameSubscriptions.add(
        this._countdowntimer.finished.subscribe({
          next: () => {
            console.log("Timer expired!");
            this._timeRemaining = 0;
            this._timeExpired = true;

            // Destroy the countdown timer
            this._countdowntimer = null;

            // Move the game to timeout status if it's still running
            this._gameStatus = GameStatus.Lose;

            // You lose
            this.lose();
          }
        })
      );

      // Start the countdown
      this._countdowntimer.start();
    }
  }

  // Setup the idle timer
  private monitorIdleTimer() {
    // Every time this pings, reset the internal timer
    this._idleResetSubject.subscribe(() => {

      // Discard the previous incantation of the timer
      if (this._idleTimerSubscription != undefined) {
        this._idleTimerSubscription.unsubscribe();
        this._idleTimerSubscription = undefined;
      }

      // Start a timer to fire in 3s
      this._idleTimerSubscription = timer(3000).subscribe(
        event => {
          this._idleTimeExpiredSubject.next();

          // Done with this timer
          this._idleTimerSubscription.unsubscribe();
          this._idleTimerSubscription = undefined;
        }
      );

      this._perGameSubscriptions.add(this._idleTimerSubscription);
    });
  }

  // Idle timer expired callback after 3s of no activity
  // This is where the system will ask for number of solutions in the background
  private idleTimeExpired() {
    // Only do this if level is normal or advanced
    if (this._difficultyLevel < DifficultyLevel.Expert) {
      this.getSolutionCount();
    }
  }

  // Keyboard entry occurred
  letterEntered(letter: string) {
    // Only accept entry on unlocked cells and if the game is not timed out and not won
    if (!this._board.words[this._selectedWord].letters[this._selectedLetter].locked
      && (this._gameMode != GameMode.Timed || this._gameStatus != GameStatus.Lose)
      && (this._gameStatus != GameStatus.Win)
    ) {
      // Backspace & Delete (mostly shared logic)
      if (
        letter === 'Backspace' ||
        letter === '{bksp}' ||
        letter === 'Delete'
      ) {
        // When you change a letter, the previous message goes away
        this._message = '';
        this.toastr.clear();

        // If the cell is blank, back up to the previous cell.
        if (this._board.words[this._selectedWord].letters[this._selectedLetter].character == null) {
          // Backup only for backspace, not delete key
          if (letter === 'Backspace' || letter === '{bksp}') {
            // Back up to the previous cell
            if (this._selectedLetter > 0) {
              // Same word, 1 char backwards
              this._selectedLetter--;
            }
          }
        }

        // If a letter is in the cell, delete it.
        if (this._board.words[this._selectedWord].letters[this._selectedLetter].character != null) {
          this._board.words[this._selectedWord].letters[this._selectedLetter].character = null;
          
          // Reset the idle timer
          this._idleResetSubject.next();
        }

        return;
      }

      // Enter key
      if (letter === 'Enter' || letter === '{enter}') {
        // In lower difficulty, check one word at a time
        if (this._difficultyLevel < DifficultyLevel.Expert) {
          // If all letters of this word are filled in, test the word
          if (this._board.words[this._selectedWord].populated) {
            // When you hit enter, the previous message goes away
            this._message = '';
            this.toastr.clear();

            // We know the current word is filled in
            // Need to determine if you test 1 word or all of them
            // Validate a single word
            this.testSingleWord();
          }
        } else {
          // In higher difficulty, check the whole puzzle at once
          let boardFullyPopulated: boolean = true;
          for (const word of this._board.words) {
            if (!word.populated) {
              boardFullyPopulated = false;
              break;
            }
          }
          if (boardFullyPopulated) {
            // When you hit enter, the previous message goes away
            this._message = '';
            this.toastr.clear();

            // Validate the whole puzzle
            this.testEntirePuzzle();
          }
        }
      }

      // Letters
      let found = letter.match(/^[a-z]$/gi);
      if (found) {
        // Valid letter, put it in the appropriate cell
        this._board.words[this._selectedWord].letters[this._selectedLetter].character = letter.toUpperCase();

        // Reset the idle timer
        this._idleResetSubject.next();

        // When you change a letter, the previous message goes away
        this._message = '';
        this.toastr.clear();

        // Move the input to the next appropriate cell
        if (this._selectedLetter === this._numLetters - 1) {
          // In lower difficulties, stay here so you can test the word
          // In higher levels, just move to the next word
          if (this._difficultyLevel >= DifficultyLevel.Expert) {
            if (this.selectedWord < this.numHops - 1) {
              this._selectedLetter = 0;
              this._selectedWord++;
            }
          }
        } else {
          // Move 1 to the right
          this._selectedLetter++;
        }

        // Play the sound
        this._audioService.letterEntered();
      }

      // Arrow keys
      if (letter === 'ArrowUp') {
        if (this._selectedWord > 1) this._selectedWord--;
      }
      if (letter === 'ArrowDown') {
        if (this._selectedWord < this._numHops - 1) this._selectedWord++;
      }
      if (letter === 'ArrowLeft') {
        if (this._selectedLetter > 0) this._selectedLetter--;
      }
      if (letter === 'ArrowRight') {
        if (this._selectedLetter < this._numLetters - 1) this._selectedLetter++;
      }
    }
  }

  // Async call to test a single word
  public testSingleWord() {
    // Only allowed if the difficulty is Advanced or lower and not timed out and not won
    if (this._difficultyLevel < DifficultyLevel.Expert
      && (this._gameMode != GameMode.Timed || this._gameStatus != GameStatus.Lose)
      && (this._gameStatus != GameStatus.Win)
    ) {

      // Inputs to remote call
      let wordArray = [];
      for (let i = 0; i < this._board.words.length; i++) {
        // WordArray includes everything except the testing word
        if (i != this._selectedWord) {
          wordArray.push(this._board.words[i].stringify());
        } else {
          wordArray.push(null);
        }
      }
      let testWord = this._board.words[this._selectedWord].stringify();
      let testPosition = this._selectedWord;

      // Mark the word as currently being tested, not solved, not wrong, not broken
      this._board.words[this._selectedWord].status = WordStatus.Testing;

      var execStartTime = performance.now();

      // Make the remote call
      this._dataService.testWord(wordArray, testWord, testPosition)
      .then(
        // Success
        (testedWord: TestedWord) => {
          // Test is done
          this._lastExecutionTime = performance.now() - execStartTime;

          if (testedWord.valid) {
            // Word is solved
            this._board.words[testedWord.testPosition].status = WordStatus.Solved;

            // If all words are solved, you win
            let puzzleFilledIn = true;
            for (const word of this._board.words) {
              if (!word.locked && word.status != WordStatus.Solved) {
                puzzleFilledIn = false;
              }
            }

            // Show the definition of the word
            this.showDefinition(testWord);

            if (puzzleFilledIn) {
              // You win!  Call this to report the completion.
              this.win();
            } else {
              // Play a sound (yay!)
              this._audioService.wordCorrect();

              // Move to the next word (unless the user has already moved)
              if (this._selectedWord == testedWord.testPosition) {
                if (this._selectedWord < this._numHops - 1) {
                  // Need to avoid moving to a solved word.
                  // Start at the next word and move forwards.
                  for (
                    let i = testedWord.testPosition + 1;
                    i < this._numHops;
                    i++
                  ) {
                    this._board.words[i].status != WordStatus.Solved;
                    this._selectedWord = i;
                    this._selectedLetter = 0;
                    break;
                  }
                }
              }
            }
          } else {
            // Word is wrong, not solved, not broken
            this._board.words[testedWord.testPosition].status = WordStatus.Wrong;

            this._message = testedWord.error;
            // Show a toast
            this.toastr.error(testedWord.error, null, {
              timeOut: 2000
            });

            // Play a sound (boo!)
            this._audioService.wordWrong();
          }
        },
        // Failure
        (err) => {
          // An error happened trying to get words

          // The test word is broken
          this._board.words[testPosition].status = WordStatus.Broken;

          // Show a message
          this._message =
            'Failed to communicate with the server, please try again later.';
          // Show a toast
          this.toastr.error('Failed to communicate with the server, please try again later.', null, {
            timeOut: 2000
          });

          console.log('Error testing word: ' + JSON.stringify(err));
        }
      );
    }
  }

  // Show the definition of a word as a toast
  // Changed to send them to the message area
  private showDefinition(word: string, timeout: number = 4000): void {
    if (this._playerService.showDefinitions) {
      // Lookup the definition of the word
      this._dictionaryService.lookup(word)
      .then(
        // Success
        (dictionaryWord: DictionaryWord) => {
          this._eventBusService.emitNotification('definitionReceived', dictionaryWord);

          // this.toastr.info("use payload", "use payload", {
          //   toastComponent: DefinitionToast,
          //   timeOut: timeout,
          //   enableHtml: true,
          //   payload: dictionaryWord,
          //   toastClass: 'ngx-toastr dictionary-toastr',
          // });
        }
      ),
      // Failure
      (err) => {};
    }
  }

  // Async call to test a the whole puzzle
  public testEntirePuzzle() {
    // Only allowed if not timed out and not won
    if (
      (this._gameMode != GameMode.Timed || this._gameStatus != GameStatus.Lose)
      && (this._gameStatus != GameStatus.Win)
    ) {

      // Inputs to remote call
      let wordArray = [];
      for (let i = 0; i < this._board.words.length; i++) {
        wordArray.push(this._board.words[i].stringify());
      }

      // The test is done against the last word entered by the user (index = numHops - 1)
      // Word is currently being tested, not solved, not wrong, not broken
      this._board.words[this._numHops - 1].status = WordStatus.Testing;

      var execStartTime = performance.now();

      // Make the remote call
      // console.log("Validate Puzzle request: " + JSON.stringify(wordArray));
      this._dataService.validatePuzzle(wordArray)
      .then(
        // Success
        (validatedPuzzle: ValidatedPuzzle) => {
          // console.log("Validate puzzle response: " + JSON.stringify(validatedPuzzle));
          // Test is done
          if (validatedPuzzle.valid) {
            // Puzzle is valid
            this._lastExecutionTime = performance.now() - execStartTime;
  
            // You win!  Call this to report the completion.
            this.win();
          } else {
            // Puzzle is invalid

            // Word is wrong
            this._board.words[this._numHops - 1].status = WordStatus.Wrong;

            this._message = validatedPuzzle.error;
            // Show a toast
            this.toastr.error(validatedPuzzle.error, null, {
              timeOut: 2000
            });

            // Play a sound (boo!)
            this._audioService.wordWrong();
          }
        },
        // Failure
        (err) => {
          console.log("Validate puzzle response: " + err);
          // An error happened trying to get words

          // Word is broken
          this._board.words[this._numHops - 1].status = WordStatus.Broken;

          // Show a message
          this._message =
            'Failed to communicate with the server, please try again later.';
          // Show a toast
          this.toastr.error('Failed to communicate with the server, please try again later.', null, {
            timeOut: 2000
          });

          console.log('Error testing word: ' + JSON.stringify(err));
        }
      );
    }
  }

  // Async call to get the solution count
  private getSolutionCount() {
    // Inputs to remote call
    let wordArray = [];
    for (let i = 0; i < this._board.words.length; i++) {
      // WordArray includes everything on the board
      wordArray.push(this._board.words[i].stringify());
    }

    var execStartTime = performance.now();

    // Make the remote call
    this._dataService.getSolutionCount(wordArray)
    .then(
      // Success
      (solutionSet: SolutionSet) => {
        // Got an answer
        this._lastExecutionTime = performance.now() - execStartTime;

        this._solutionMessage = "Solutions: " + (solutionSet.valid == true ? solutionSet.numSolutions : 0);
      },
      // Failure
      (err) => {
        // An error happened trying to get solutions
        console.log('Error getting solution count: ' + JSON.stringify(err));
      }
    );

  }
  
  // TODO: use this to report a completion
  private win() {
    this._stopwatch.stop();

    // Make all words solved
    // All words are solved
    this._board.setUserWordStatus(WordStatus.Solved);

    this._gameStatus = GameStatus.Win;
    this._message = '!!! YOU WIN !!!';
    this._audioService.puzzleSolved();

    // Clean up timing stuff
    if (this._gameMode == GameMode.Timed) {
      if (this._countdowntimer) {
        this._countdowntimer.stop();
        this._countdowntimer = null;
      }
    }

    // Reset anything required from the current game (including the timer)
    console.log("Unsubscribing from per-game subscriptions");
    this._perGameSubscriptions.unsubscribe();
    this._perGameSubscriptions = new Subscription();    
    
    // Tell the game service
    this._eventBusService.emitNotification('gameWon', null);
  }

  // Stop the current game prematurely
  private __loseOrTerminate() {
    // Stop the timer
    this._stopwatch.stop();

    // Stop the countdown
    if (this._countdowntimer) {
      this._countdowntimer.stop();
      this._countdowntimer = null;
    }
    
    this._message = "Game over! You lose!";
    // Show a toast
    this.toastr.error("Game over! You lose!", null, {
      timeOut: 5000
    });
    this._audioService.puzzleLost();
    this._gameStatus = GameStatus.Lose;

    // Reset anything required from the current game (including the timer)
    console.log("Unsubscribing from per-game subscriptions");
    this._perGameSubscriptions.unsubscribe();
    this._perGameSubscriptions = new Subscription();    
    
    // Get all the solutions

    // Inputs to remote call
    let wordArray = [];
    for (let i = 0; i < this._board.words.length; i++) {
      // WordArray includes everything including the partial word (spaces filled in)
      wordArray.push(this._board.words[i].stringify());
    }
    
    // Get all the possible solutions so we can show the user why they lose
    this._dataService.getAllSolutions(wordArray)
    .then(
      // Success
      (solutionSet : SolutionSet) => {


        if (solutionSet.valid && solutionSet.solutions.length > 0) {
          // Got some solutions, store them
          // They each look like [abc, def, xyx]
          
          for (const solution of solutionSet.solutions) {
            this._board.addSolution(solution);
          }

          // Show the number of solutions
          this._solutionMessage = "Solutions: " + solutionSet.numSolutions;

          // Tell the board to cycle through solutions
          let cycleSubscription: Subscription = this._board.cycleThroughSolutions();

          // Set the flip subscription to be unsubscribed when the next game starts
          this._perGameSubscriptions.add(cycleSubscription);


        } else {
          console.log("No solutions available");
        }


      },
      // Failure
      (err) => {
        // API call for solutions failed, nothing to be done here
      }
    );
  }

  // You lose
  private lose() {
    console.log("GameService: lose");

    // Shared lose/abandon logic 
    this.__loseOrTerminate();

    // Tell the game service
    this._eventBusService.emitNotification('gameLost', null);
  }
  

  // If a game is running, kill it
  private terminate() {
    if (this._gameStatus == GameStatus.Run) {
      console.log("GameService: terminate game requested");

      // Shared lose/abandon logic
      this.__loseOrTerminate();

      // Tell the game service
      this._eventBusService.emitNotification('gameTerminated', null);
    }
  }

  // Get a hint for the current word
  // Send the request in without the current word.  When the reply comes back, clear
  // the word and put that letter in the right place.
  public getHint() {
    // Only allowed if the difficulty is Normal and not timed out and not won
    if (this._difficultyLevel < DifficultyLevel.Advanced
      && (this._gameMode != GameMode.Timed || this._gameStatus != GameStatus.Lose)
      && (this._gameStatus != GameStatus.Win)
    ) {
      // Inputs to remote call
      let wordArray = [];
      for (let i = 0; i < this._board.words.length; i++) {
        // WordArray includes everything including the partial word (spaces filled in)
        // Handle an incomplete word
        let incWord = '';
        for (const letter of this._board.words[i].letters) {
          if (letter.character != null) {
            incWord += letter.character;
          } else {
            incWord += ' ';
          }
        }
        wordArray.push(incWord);
      }
      let hintPosition = this._selectedWord;

      // Mark the word as currently being tested, not solved, not wrong
      this._board.words[this._selectedWord].status = WordStatus.Testing;

      var execStartTime = performance.now();

      // Make the remote call -- Basic, 1-letter hint
      if (this._hintType == HintType.Basic) {
        this._dataService.getHint(wordArray, hintPosition)
        .then(
          // Success
          (basicHint : BasicHint) => {
            console.log('Got basic hint: ' + JSON.stringify(basicHint));
            // Test is done
            this._lastExecutionTime = performance.now() - execStartTime;

            if (basicHint.valid) {
              // Word is not solved, not wrong, not broken
              this._board.words[basicHint.hintWord].status = WordStatus.Initialized;

              // Plug in the hint by moving to the cell and typing (to get other events)
              this.setSelectedCell(basicHint.hintWord, basicHint.hintPosition);
              this.letterEntered(basicHint.hintLetter);

              // Play a sound
              this._audioService.hintGiven();

              // Record the number of hints given
              this._numHintsGiven++;

              return;
            } else {
              // Couldn't get a hint, tell the player
              this._message = basicHint.error;
              // Show a toast
              this.toastr.error(basicHint.error, null, {
                timeOut: 2000
              });

              // Word is reset
              this._board.words[basicHint.hintWord].status = WordStatus.Initialized;

              // Play a sound
              this._audioService.hintUnavailable();
            }
          },
          // Failure
          (err) => {
            // An error happened trying to get hint

            // The test word is broken
            this._board.words[hintPosition].status = WordStatus.Broken;

            // Show a message
            this._message =
              'Failed to communicate with the server, please try again later.';
            // Show a toast
            this.toastr.error('Failed to communicate with the server, please try again later.', null, {
              timeOut: 2000
            });

            console.log('Error testing word: ' + JSON.stringify(err));
          }
        );
      }
      // Make the remote call -- Whole-word hint
      if (this._hintType == HintType.WholeWord) {
        this._dataService.getFullHint(wordArray, hintPosition)
        .then(
          // Success
          (wordHint : WholeWordHint) => {
            console.log('Got whole-word hint: ' + JSON.stringify(wordHint));
            this._lastExecutionTime = performance.now() - execStartTime;


            if (wordHint.valid) {
              // Word is solved
              this._board.words[wordHint.hintWord].status = WordStatus.Solved;

              // Plug in the hint by moving to the cell and typing (to get other events)
              this._board.words[wordHint.hintWord].setText(wordHint.hintText);

              // Record the number of hints given
              this._numHintsGiven++;

              // Run the test routine (which should always work)
              this.testSingleWord();

              return;
            } else {
              // Couldn't get a hint, tell the player
              this._message = wordHint.error;
              // Show a toast
              this.toastr.error(wordHint.error, null, {
                timeOut: 2000
              });

              // Play a sound
              this._audioService.hintUnavailable();
            }
          },
          // Failure
          (err) => {
            // An error happened trying to get words

            // The test word is broken
            this._board.words[hintPosition].status = WordStatus.Broken;

            // Show a message
            this._message =
              'Failed to communicate with the server, please try again later.';
            // Show a toast
            this.toastr.error('Failed to communicate with the server, please try again later.', null, {
              timeOut: 2000
            });

            console.log('Error testing word: ' + JSON.stringify(err));
          },
        );
      }
    }
  }

  // Set the selected cell
  public setSelectedCell(word, letter) {
    // Only move the selection if the word isn't locked
    // And the game is not timed out and not won
    if (
      !this._board.words[word].locked
      && (this._gameMode != GameMode.Timed || this._gameStatus != GameStatus.Lose)
      && (this._gameStatus != GameStatus.Win)
    ) {
      this._selectedWord = word;
      this._selectedLetter = letter;
    }
  }

  /////
  // Getters
  /////

  get board() {
    return this._board;
  }

  get gameStatus() {
    return this._gameStatus;
  }

  get selectedWord() {
    return this._selectedWord;
  }
  set selectedWord(index: number) {
    this._selectedWord = index;
  }

  get selectedLetter() {
    return this._selectedLetter;
  }
  set selectedLetter(index: number) {
    this._selectedLetter = index;
  }

  get numLetters() {
    return this._numLetters;
  }

  get numHops() {
    return this._numHops;
  }

  get message() {
    return this._message;
  }

  get lastExecutionTime() {
    return this._lastExecutionTime;
  }

  public get difficultyLevel(): DifficultyLevel {
    return this._difficultyLevel;
  }

  public get gameMode(): GameMode {
    return this._gameMode;
  }

  // Stuff for a timed game
  public get timeRemaining(): number {
    return this._timeRemaining;
  }
  public get timeExpired(): boolean {
    return this._timeExpired;
  }

  // Unique ID of the game
  public get gameId(): string {
    return this._gameId;
  }
  // Word pair
  public get wordPair(): WordPair {
    return this._wordPair;
  }
  // Number of hints given
  public get numHintsGiven(): number {
    return this._numHintsGiven;
  }
  // Game execution time (assuming it's finished)
  public get gameExecutionMs(): number {
    return this._stopwatch.timeElapsed;
  }

  public get board_stringified(): string {
    if (this.board)
      return this.board.stringify();
    else
      return "not yet";
  }

  public get solutionMessage(): string {
    return this._solutionMessage;
  }
}
