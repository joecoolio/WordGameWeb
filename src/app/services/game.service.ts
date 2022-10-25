import { Injectable } from '@angular/core';
import { DataService, WordPair, TestedWord, BasicHint, WholeWordHint, SolutionSet, ValidatedPuzzle } from './data.service';
import { AudioService } from './audio.service';
import { PlayerService, GameMode, HintType, DifficultyLevel, PlayerInfo} from './player.service';
import { firstValueFrom, skip, Subscription } from 'rxjs';
import { TimerService } from './timer.service';
import { Board, WordStatus } from '../model/board';

export enum GameStatus {
  Initialize,  // The game isn't setup yet
  Run,         // The game is running
  Win,         // You win!
  Broken,      // Something is borked
  Timeout      // Timed mode & time is up, you lose sucka
}

@Injectable({ providedIn: 'root' })
export class GameService {
  // Min & max number of letters & hops
  readonly MIN_LETTERS: number = 3;
  readonly MAX_LETTERS: number = 5;
  readonly MIN_HOPS: number = 2;
  readonly MAX_HOPS: number = 5;

  // The game board
  private _board: Board;

  // Status of the game:  run, win, broken, initialize
  private _gameStatus: GameStatus = GameStatus.Initialize;

  // Parameters of the current game
  private _numLetters: number;
  private _numHops: number;
  private _gameMode: GameMode;
  private _difficultyLevel: DifficultyLevel;
  private _hintType: HintType;

  // Parameters (that can change at any time) of the player
  private _playerInfoSubscription: Subscription;
  private _playerInfo: PlayerInfo;

  // Selected row/cell indexes
  private _selectedWord: number = 1;
  private _selectedLetter: number = 0;

  // Message back from the validation routines
  private _message: string = '';

  // Execution time of the last api call
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
    this._playerInfoSubscription = this._playerService.settingsChanged().pipe(skip(1)).subscribe({
      next: (newPlayerInfo) => {
          // User settings changed
          console.log("Loaded user: " + JSON.stringify(newPlayerInfo));
          this._playerInfo = newPlayerInfo;
      },
      error: (err) => {
          // User load failed
          console.log("Failed to load user: " + err);
      }
    });

    // Ask the player service to load (will be notified via settingsChanged observer)
    this._playerService.getSettings(()=>{}, ()=>{});

    // Setup the per game subscriptions
    this._perGameSubscriptions = new Subscription();
  }

  // Word pair retrieved from the server
  private _wordPair: WordPair | undefined;

  // Create a new game
  async newGame() : Promise<void> {
    // Do not try to start a game until the player has been loaded
    await firstValueFrom(this._playerService.settingsChanged().pipe(skip(1)));
    console.log("Initial player load has occured");

    // Reset anything required from the previous game
    console.log("Unsubscribing from per-game subscriptions");
    this._perGameSubscriptions.unsubscribe();
    this._perGameSubscriptions = new Subscription();    

    // Once you have player settings, you can create a game
    return new Promise((resolve, reject) => {
      this._gameStatus = GameStatus.Initialize;

      // Reset game parameters to the user's preferences
      this._numLetters = this._playerInfo.settings.numLetters;
      this._numHops = this._playerInfo.settings.numHops;
      this._gameMode = this._playerInfo.settings.gameMode;
      this._difficultyLevel = this._playerInfo.settings.difficultyLevel;
      this._hintType = this._playerInfo.settings.hintType;

      console.log(
        'Initialize new game: letters = ' + this._numLetters + ' / hops = ' + this._numHops +
          " mode = " + this._gameMode
      );

      console.log('Requesting word pair...');

      // Setup a new board
      this._board = new Board(this._numLetters, this._numHops);
      this._message = 'Requesting a pair of words...';
      var execStartTime = performance.now();

      // Flag puzzle as loading
      this._board.setPairWordStatus(WordStatus.Loading);

      this._dataService
        .getPair(this.numLetters, this._numHops)
        .then(
          // Success
          (wordpair: WordPair) => {
            this._wordPair = { ...wordpair };
            this._lastExecutionTime = performance.now() - execStartTime;

            console.log('Got wordpair: ' + JSON.stringify(this._wordPair));
            this._board.initialize(this._wordPair.startWord, this._wordPair.endWord);
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
            this._board.setPairWordStatus(WordStatus.Broken);

            // Show a message
            this._message =
              'Failed to communicate with the server, please try again later.';

            console.log('Error getting words: ' + JSON.stringify(err));

            reject();
          }
        );
      
    });
  }

  private startGame() {
    // If it's a timed game, start the counter
    if (this._playerInfo.settings.gameMode == GameMode.Timed) {
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
    // Only accept entry on unlocked cells and if the game is not timed out and not won
    if (!this._board.words[this._selectedWord].letters[this._selectedLetter].locked
      && (this._gameMode != GameMode.Timed || this._gameStatus != GameStatus.Timeout)
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

        // Remove the letter from the current cell
        this._board.words[this._selectedWord].letters[this._selectedLetter].character = null;

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
        // In lower difficulty, check one word at a time
        if (this._difficultyLevel < DifficultyLevel.Expert) {
          // If all letters of this word are filled in, test the word
          if (this._board.words[this._selectedWord].populated) {
            // When you hit enter, the previous message goes away
            this._message = '';

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

        // When you change a letter, the previous message goes away
        this._message = '';

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
      && (this._gameMode != GameMode.Timed || this._gameStatus != GameStatus.Timeout)
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

          console.log('Error testing word: ' + JSON.stringify(err));
        }
      );
    }
  }

  // Async call to test a the whole puzzle
  public testEntirePuzzle() {
    // Only allowed if not timed out and not won
    if (
      (this._gameMode != GameMode.Timed || this._gameStatus != GameStatus.Timeout)
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

          console.log('Error testing word: ' + JSON.stringify(err));
        }
      );
    }
  }
  
  // TODO: use this to report a completion
  private win() {
    // Make all words solved
    // All words are solved
    this._board.setUserWordStatus(WordStatus.Solved);

    this._gameStatus = GameStatus.Win;
    this._message = '!!! YOU WIN !!!';
    this._audioService.puzzleSolved();

    // Clean up timing stuff
    if (this._playerInfo.settings.gameMode == GameMode.Timed) {
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

  // Get a hint for the current word
  // Send the request in without the current word.  When the reply comes back, clear
  // the word and put that letter in the right place.
  public getHint() {
    // Only allowed if the difficulty is Normal and not timed out and not won
    if (this._difficultyLevel < DifficultyLevel.Advanced
      && (this._gameMode != GameMode.Timed || this._gameStatus != GameStatus.Timeout)
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

              return;
            } else {
              // Couldn't get a hint, tell the player
              this._message = basicHint.error;

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

            // The test word is broken
            this._board.words[hintPosition].status = WordStatus.Broken;

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
    // And the game is not timed out and not won
    if (
      !this._board.words[word].locked
      && (this._gameMode != GameMode.Timed || this._gameStatus != GameStatus.Timeout)
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


}
