import { Injectable } from '@angular/core';
import { DataService, WordPair, TestedWord, BasicHint, WholeWordHint, SolutionSet } from './data.service';
import { AudioService } from './audio.service';
import { PlayerService, GameMode, HintType, DifficultyLevel, PlayerSettings} from './player.service';
import { firstValueFrom, Subscription, timer } from 'rxjs';
import { TimerService } from './timer.service';

export enum GameStatus {
  Initialize,  // The game isn't setup yet
  Run,         // The game is running
  Win,         // You win!
  Broken,      // Something is borked
  Timeout      // Timed mode & time is up, you lose sucka
}

@Injectable({
  providedIn: 'root',
})
export class GameService {
  // Min & max number of letters & hops
  readonly MIN_LETTERS: number = 3;
  readonly MAX_LETTERS: number = 5;
  readonly MIN_HOPS: number = 2;
  readonly MAX_HOPS: number = 5;

  // The game board - array of words each of which has:
  //   .letters = array of the letters of the word
  //   .locked = true if this word cannot be changed
  //   .solved = true if this word is verified
  //   .wrong = word was tested and is wrong
  //   .testing = word is currently being tested
  //   .loading = word is being loaded
  //   .populated = word is fully populated (all letters)
  //   .broken = server problem, try again
  private _board = [];

  // Status of the game:  run, win, broken, initialize
  private _gameStatus: GameStatus = GameStatus.Initialize;

  // Parameters of the current game
  private _numLetters: number;
  private _numHops: number;
  private _gameMode: GameMode;
  private _difficultyLevel: DifficultyLevel;
  private _hintType: HintType;

  // Parameters (that can change at any time) of the player
  private _playerSettingsSubscription: Subscription;
  private _playerSettings: PlayerSettings;

  // Selected row/cell indexes
  private _selectedWord: number = 1;
  private _selectedLetter: number = 0;

  // Message back from the validation routines
  private _message: string = '';

  // Execution time of the last api call
  private _lastExecutionTimeAPI: number = 0; // Exec time on the server
  private _lastExecutionTime: number = 0; // Round trip execution

  // Timer subscriptions for timed game
  private _timerTickSub: Subscription;
  private _timerFinishedSub: Subscription;
  private _timeRemaining: number;
  private _timeExpired: boolean = false;

  // Everything in here should be unsubscribed at the start of every game
  private _perGameSubscriptions: Subscription;

  constructor(
    private _dataService: DataService,
    private _audioService: AudioService,
    private _playerService: PlayerService,
    private _timerService: TimerService)
  {
    // Subscribe to get player settings when they change
    this._playerSettingsSubscription = this._playerService.settingsChanged().subscribe({
      next: (newPlayerSettings) => {
          // User settings changed
          console.log("Loaded user: " + newPlayerSettings.numLetters + " / " + newPlayerSettings.numHops);
          this._playerSettings = newPlayerSettings;
      },
      error: (err) => {
          // User load failed
          console.log("Failed to load user: " + err);
      }
    });

    // Ask the player service to load (will be notified via settingsChanged observer)
    this._playerService.load();

    // Setup the per game subscriptions
    this._perGameSubscriptions = new Subscription();
  }

  // Word pair retrieved from the server
  private _wordPair: WordPair | undefined;

  // Create a new game
  async newGame() : Promise<void> {
    // Do not try to start a game until the player has been loaded
    await firstValueFrom(this._playerService.settingsChanged());
    console.log("Initial player load has occured");

    // Reset anything required from the previous game
    console.log("Unsubscribing from per-game subscriptions");
    this._perGameSubscriptions.unsubscribe();
    this._perGameSubscriptions = new Subscription();    

    // Once you have player settings, you can create a game
    return new Promise((resolve, reject) => {
      this._gameStatus = GameStatus.Initialize;

      // Reset game parameters to the user's preferences
      this._numLetters = this._playerSettings.numLetters;
      this._numHops = this._playerSettings.numHops;
      this._gameMode = this._playerSettings.gameMode;
      this._difficultyLevel = this._playerSettings.difficultyLevel;
      this._hintType = this._playerSettings.hintType;

      console.log(
        'Initialize new game: letters = ' + this._numLetters + ' / hops = ' + this._numHops +
          " mode = " + this._gameMode
      );

      console.log('Requesting word pair...');

      this._board = this.createEmptyBoard();

      this._message = 'Requesting a pair of words...';

      var execStartTime = performance.now();

      this._dataService
        .getPair(this.numLetters, this._numHops)
        .then(
          // Success
          (wordpair: WordPair) => {
            this._wordPair = { ...wordpair };
            this._lastExecutionTime = performance.now() - execStartTime;
            this._lastExecutionTimeAPI = this._wordPair.executionTime;

            console.log('Got wordpair: ' + JSON.stringify(this._wordPair));
            this.populateBoard();
            this._message = '';

            // Reset the current word/cell to the top
            this._selectedWord = 1;
            this._selectedLetter = 0;

            // The game is now running
            this._gameStatus = GameStatus.Run;

            // The game is ready, do any other stuff necessary
            this.startGame();

            resolve();
          },
          // Failure
          (err) => {
            // An error happened trying to get words

            // The game is broken
            this._gameStatus = GameStatus.Broken;

            // The words are no longer loading
            for (const word of this._board) {
              word.loading = false;
            }

            // Show a message
            this._message =
              'Failed to communicate with the server, please try again later.';

            console.log('Error getting words: ' + JSON.stringify(err));

            reject();
          }
        );
      
    });
  }

  private createEmptyBoard() {
    // Create a 2d board holding correct number words and letters each / all nulls
    let board = [];
    for (let i = 0; i < this._numHops + 1; i++) {
      board[i] = {
        letters: [],
        locked: false,
        solved: false,
        wrong: false,
        testing: false,
        loading: false,
        populated: false,
        broken: false,
      };
      for (let j = 0; j < this._numLetters; j++) {
        board[i].letters.push(null);
      }
    }
    // First and last words are locked
    board[0].locked = true;
    board[this._numHops].locked = true;

    // First and last words are loading
    board[0].loading = true;
    board[this._numHops].loading = true;

    return board;
  }

  private populateBoard() {
    // Fill in the first & last words on the board
    for (let j = 0; j < this._numLetters; j++) {
      this.board[0].letters[j] = this._wordPair.startWord.charAt(j);
      this.board[this._numHops].letters[j] = this._wordPair.endWord.charAt(j);
    }

    // First and last words are populated
    this.board[0].populated = true;
    this.board[this._numHops].populated = true;

    // First and last words are not loading
    this.board[0].loading = false;
    this.board[this._numHops].loading = false;
  }

  private startGame() {
    // If it's a timed game, start the counter
    if (this._playerSettings.gameMode == GameMode.Timed) {
      this._timeExpired = false;

      // Stop the timer if it's already running
      this._timerService.stopTimer();

      // Register subscriptions if needed
      if (this._timerTickSub === undefined) {
        this._timerTickSub = this._timerService.tick().subscribe({
          next: (msRemaining) => {
            // console.log("Tick: " + sRemaining);
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
        });
      }

      if (this._timerFinishedSub === undefined) {
        this._timerFinishedSub = this._timerService.finished().subscribe({
          next: () => {
            // console.log("Finished!");
            this._timeRemaining = 0;
            this._timeExpired = true;
    
            // Move the game to timeout status if it's still running
            this._gameStatus = GameStatus.Timeout;

            // You lose
            this.lose();
          }
        });
      }

      // Allocate 10 seconds per word to fill in
      let timeS = 10 * (this._numHops - 1);

      // Start the timer
      this._timerService.startTimer(timeS * 1000);
    }
  }

  // Keyboard entry occurred
  letterEntered(letter: string) {
    // Only accept entry on unlocked cells and if the game is not timed oud
    if (!this._board[this._selectedWord].locked &&
      (this._gameMode != GameMode.Timed || this._gameStatus != GameStatus.Timeout)
    ) {
      // Backspace & Delete (mostly shared logic)
      if (
        letter === 'Backspace' ||
        letter === '{bksp}' ||
        letter === 'Delete'
      ) {
        // When you change a letter, the previous message goes away
        this._message = '';

        // Remove the letter from the current cell
        this._board[this._selectedWord].letters[this._selectedLetter] = null;

        // The word is no longer fully populated
        this._board[this._selectedWord].populated = false;

        // When you delete or backspace, this word is no longer solved
        this._board[this._selectedWord].solved = false;

        // When you delete or backspace, this word is no longer wrong
        this._board[this._selectedWord].wrong = false;

        // When you delete or backspace, this word is no longer broken
        this._board[this._selectedWord].broken = false;

        // Backspace moves the current cell where delete doesn't
        if (letter === 'Backspace' || letter === '{bksp}') {
          // Back up to the previous cell
          if (this._selectedLetter > 0) {
            // Same word, 1 char backwards
            this._selectedLetter--;
          }
        }

        return;
      }

      // Enter key
      if (letter === 'Enter' || letter === '{enter}') {
        // If all letters of this word are filled in, test the word
        if (this._board[this._selectedWord].populated) {
          // When you hit enter, the previous message goes away
          this._message = '';

          // We know the current word is filled in
          // Need to determine if you test 1 word or all of them
          // Validate a single word
          this.testSingleWord();
        }
      }

      // Letters
      let found = letter.match(/^[a-z]$/gi);
      if (found) {
        // Valid letter, put it in the appropriate cell
        this._board[this._selectedWord].letters[this._selectedLetter] =
          letter.toUpperCase();

        // When you change a letter, this word is no longer wrong or solved
        this._board[this._selectedWord].wrong = false;
        this._board[this._selectedWord].solved = false;

        // Check to see if the word is fully populated
        let populated = true;
        for (const letter of this._board[this._selectedWord].letters) {
          if (letter == null) {
            populated = false;
          }
        }
        if (populated) this._board[this._selectedWord].populated = true;

        // When you change a letter, the previous message goes away
        this._message = '';

        // Move the input to the next appropriate cell
        if (this._selectedLetter === this._numLetters - 1) {
          // Move to check button
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
  private testSingleWord() {
    // Output from remote call
    let testedWord: TestedWord;

    // Inputs to remote call
    let wordArray = [];
    for (let i = 0; i < this._board.length; i++) {
      // WordArray includes everything except the testing word
      if (i != this._selectedWord) {
        wordArray.push(this._board[i].letters.join(''));
      } else {
        wordArray.push('');
      }
    }
    let testWord = this._board[this._selectedWord].letters.join('');
    let testPosition = this._selectedWord;

    // Mark the word as currently being tested, not solved, not wrong, not broken
    this._board[this._selectedWord].testing = true;
    this._board[this._selectedWord].solved = false;
    this._board[this._selectedWord].wrong = false;
    this._board[this._selectedWord].broken = false;

    var execStartTime = performance.now();

    // Make the remote call
    this._dataService.testWord(wordArray, testWord, testPosition)
    .then(
      // Success
      (testedWord: TestedWord) => {
        // Test is done
        this._board[testedWord.testPosition].testing = false;
        // The test word is not broken
        this._board[testedWord.testPosition].broken = false;

        this._lastExecutionTime = performance.now() - execStartTime;
        this._lastExecutionTimeAPI = testedWord.executionTime;

        if (testedWord.valid) {
          // Word is solved, not wrong, not broken
          this._board[testedWord.testPosition].solved = true;
          this._board[testedWord.testPosition].wrong = false;
          this._board[testedWord.testPosition].broken = false;

          // If all words are solved, you win
          let puzzleFilledIn = true;
          for (const word of this._board) {
            if (!word.locked && !word.solved) {
              puzzleFilledIn = false;
            }
          }
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
                  this._board[i].solved == false;
                  this._selectedWord = i;
                  this._selectedLetter = 0;
                  break;
                }
              }
            }
          }
        } else {
          // Word is wrong, not solved, not broken
          this._board[testedWord.testPosition].solved = false;
          this._board[testedWord.testPosition].wrong = true;
          this._board[testedWord.testPosition].broken = false;

          this._message = testedWord.error;

          // Play a sound (boo!)
          this._audioService.wordWrong();
        }
      },
      // Failure
      (err) => {
        // An error happened trying to get words

        // Test is done
        this._board[testPosition].testing = false;

        // The test word is broken
        this._board[testPosition].broken = true;

        // Show a message
        this._message =
          'Failed to communicate with the server, please try again later.';

        console.log('Error testing word: ' + JSON.stringify(err));
      }
    );
  }

  // TODO: use this to report a completion
  private win() {
    this._gameStatus = GameStatus.Win;
    this._message = '!!! YOU WIN !!!';
    this._audioService.puzzleSolved();

    // Clean up timing stuff
    if (this._playerSettings.gameMode == GameMode.Timed) {
      this._timerService.stopTimer();
    }
  }

  // TODO: use this to report a loss
  private lose() {
    this._message = "Time ran out, you lose!";
    this._audioService.puzzleLost();

    // Get all the solutions

    // Inputs to remote call
    let wordArray = [];
    for (let i = 0; i < this._board.length; i++) {
      // WordArray includes everything including the partial word (spaces filled in)
      // Handle an incomplete word
      let incWord = '';
      for (const letter of this._board[i].letters) {
        if (letter != null) {
          incWord += letter;
        } else {
          incWord += ' ';
        }
      }
      wordArray.push(incWord);
    }
    
    // Get all the possible solutions so we can show the user why they lose
    this._dataService.getAllSolutions(wordArray)
    .then(
      // Success
      (solutionSet : SolutionSet) => {


        if (solutionSet.valid && solutionSet.solutions.length > 0) {
          // Got some solutions, store them
          // They each look like [abc, def, xyx]
          
          for (const wordArray of solutionSet.solutions) {
            console.log("Solution: " + wordArray.toString());
          }

          // Store the original words so we can get back to them
          let puzzleWords: string[] = [];
          for (const word of this._board) {
            puzzleWords.push(word.letters);
          }
          console.log("Puzzle: " + puzzleWords.toString());

          // Which solution to show (this increments and cyles)
          let solutionToShow: number = 0;

          // Setup a timer so we can blink the solutions up for the user every 5 seconds
          let showSolutionSubscription: Subscription = timer(3000, 5000).subscribe(
            event => {
              // console.log("Flipping to: " + solutionToShow + ": " + solutionSet.solutions[solutionToShow].toString());
              // Show one of the solutions instead of the puzzle
              for (let wordIndex = 0; wordIndex < this._board.length; wordIndex++) {
                this._board[wordIndex].letters = solutionSet.solutions[solutionToShow][wordIndex].split('');
              }
              solutionToShow = (solutionToShow < solutionSet.solutions.length - 1) ? solutionToShow+1 : 0;

              // Setup a one-time timer to flip back to the puzzle after 2 seconds
              let showOriginalSubscription: Subscription = timer(2000).subscribe(
                event => {
                  // console.log("Flipping back: " + puzzleWords.toString());
                  for (let wordIndex = 0; wordIndex < this._board.length; wordIndex++) {
                    this._board[wordIndex].letters = puzzleWords[wordIndex];
                  }

                  showOriginalSubscription.unsubscribe;
                }
              );
              // Add original subscription to solution subscription
              // This way, if you start a new game everything gets unsubscribed
              showSolutionSubscription.add(showOriginalSubscription);
            }
          );
          // Set the flip subscription to be unsubscribed when the next game starts
          this._perGameSubscriptions.add(showSolutionSubscription);



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

  // Get a hint for the current word
  // Send the request in without the current word.  When the reply comes back, clear
  // the word and put that letter in the right place.
  public getHint() {
    // Only allowed if the difficulty is Normal and not timed out
    if (this._difficultyLevel < DifficultyLevel.Advanced && 
      (this._gameMode != GameMode.Timed || this._gameStatus != GameStatus.Timeout)
    ) {
      // Inputs to remote call
      let wordArray = [];
      for (let i = 0; i < this._board.length; i++) {
        // WordArray includes everything including the partial word (spaces filled in)
        // Handle an incomplete word
        let incWord = '';
        for (const letter of this._board[i].letters) {
          if (letter != null) {
            incWord += letter;
          } else {
            incWord += ' ';
          }
        }
        wordArray.push(incWord);
      }
      let hintPosition = this._selectedWord;

      // Mark the word as currently being tested, not solved, not wrong
      this._board[this._selectedWord].testing = true;
      this._board[this._selectedWord].solved = false;
      this._board[this._selectedWord].wrong = false;

      var execStartTime = performance.now();

      // Make the remote call -- Basic, 1-letter hint
      if (this._hintType == HintType.Basic) {
        this._dataService.getHint(wordArray, hintPosition)
        .then(
          // Success
          (basicHint : BasicHint) => {
            console.log('Got basic hint: ' + JSON.stringify(basicHint));
            // Test is done
            this._board[basicHint.hintWord].testing = false;
            // The test word is not broken
            this._board[basicHint.hintWord].broken = false;

            this._lastExecutionTime = performance.now() - execStartTime;
            this._lastExecutionTimeAPI = basicHint.executionTime;


            if (basicHint.valid) {
              // Word is not solved, not wrong, not broken
              this._board[basicHint.hintWord].solved = false;
              this._board[basicHint.hintWord].wrong = false;
              this._board[basicHint.hintWord].broken = false;

              // Plug in the hint by moving to the cell and typing (to get other events)
              this.setSelectedCell(basicHint.hintWord, basicHint.hintPosition);
              this.letterEntered(basicHint.hintLetter);

              // Play a sound
              this._audioService.hintGiven();

              return;
            } else {
              // Couldn't get a hint, tell the player
              this._message = basicHint.error;

              // Play a sound
              this._audioService.hintUnavailable();
            }
          },
          // Failure
          (err) => {
            // An error happened trying to get hint

            // Test is done
            this._board[hintPosition].testing = false;

            // The test word is broken
            this._board[hintPosition].broken = true;

            // Show a message
            this._message =
              'Failed to communicate with the server, please try again later.';

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
            // Test is done
            this._board[wordHint.hintWord].testing = false;
            // The test word is not broken
            this._board[wordHint.hintWord].broken = false;

            this._lastExecutionTime = performance.now() - execStartTime;
            this._lastExecutionTimeAPI = wordHint.executionTime;


            if (wordHint.valid) {
              // Word is solved, not wrong, not broken
              this._board[wordHint.hintWord].solved = true;
              this._board[wordHint.hintWord].wrong = false;
              this._board[wordHint.hintWord].broken = false;

              // Plug in the hint by moving to the cell and typing (to get other events)
              this._board[wordHint.hintWord].letters = wordHint.hintText.split('');

              // Run the test routine (which should always work)
              this.testSingleWord();

              return;
            } else {
              // Couldn't get a hint, tell the player
              this._message = wordHint.error;

              // Play a sound
              this._audioService.hintUnavailable();
            }
          },
          // Failure
          (err) => {
            // An error happened trying to get words

            // Test is done
            this._board[hintPosition].testing = false;

            // The test word is broken
            this._board[hintPosition].broken = true;

            // Show a message
            this._message =
              'Failed to communicate with the server, please try again later.';

            console.log('Error testing word: ' + JSON.stringify(err));
          },
        );
      }
    }
  }

  // Set the selected cell
  public setSelectedCell(word, letter) {
    // Only move the selection if the word isn't locked
    // And the game is not timed out
    if (!this._board[word].locked && 
      (this._gameMode != GameMode.Timed || this._gameStatus != GameStatus.Timeout)
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

  get lastExecutionTimeAPI() {
    return this._lastExecutionTimeAPI;
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


}
