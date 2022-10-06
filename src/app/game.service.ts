import { Injectable } from '@angular/core';
import { DataService, WordPair, TestedWord, WordHint } from './data.service';

@Injectable()
export class GameService {
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
  private _gameStatus: string = 'initialize';

  // Parameters of the game
  private _numLetters: number = 5;
  private _numHops: number = 5;

  // Selected row/cell indexes
  private _selectedWord: number = 1;
  private _selectedLetter: number = 0;

  // Message back from the validation routines
  private _message: string = '';

  constructor(private dataService: DataService) {
    this.newGame();
  }

  // Word pair retrieved from the server
  wordPair: WordPair | undefined;

  newGame() {
    this._gameStatus = 'initialize';

    console.log('Requesting word pair...');

    this._board = this.createEmptyBoard();
    this._message = 'Requesting a pair of words...';

    this.dataService
      .getPair(this.numLetters, this._numHops)
      // resp is of type `HttpResponse<WordPair>`
      .subscribe({
        next: (wordpair) => {
          this.wordPair = { ...wordpair };

          console.log('Got wordpair: ' + JSON.stringify(this.wordPair));
          this.populateBoard();
          this._message = '';

          // Reset the current word/cell to the top
          this._selectedWord = 1;
          this._selectedLetter = 0;
        },
        error: (err) => {
          // An error happened trying to get words

          // The game is broken
          this._gameStatus = 'broken';

          // The words are no longer loading
          for (const word of this._board) {
            word.loading = false;
          }

          // Show a message
          this._message =
            'Failed to communicate with the server, please try again later.';

          console.log('Error getting words: ' + JSON.stringify(err));
        },
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
      this.board[0].letters[j] = this.wordPair.startWord.charAt(j);
      this.board[this._numHops].letters[j] = this.wordPair.endWord.charAt(j);
    }

    // First and last words are populated
    this.board[0].populated = true;
    this.board[this._numHops].populated = true;

    // First and last words are not loading
    this.board[0].loading = false;
    this.board[this._numHops].loading = false;

    // Game is ready to go
    this._gameStatus = 'run';
  }

  // Keyboard entry occurred
  letterEntered(letter: string) {
    if (!this._board[this._selectedWord].locked) {
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

    // Mark the word as currently being tested, not solved, not wrong
    this._board[this._selectedWord].testing = true;
    this._board[this._selectedWord].solved = false;
    this._board[this._selectedWord].wrong = false;

    // Make the remote call
    this.dataService.testWord(wordArray, testWord, testPosition).subscribe({
      next: (testedWord) => {
        // Test is done
        this._board[testedWord.testPosition].testing = false;
        // The test word is not broken
        this._board[testedWord.testPosition].broken = false;

        if (testedWord.valid) {
          // Word is solved, not wrong
          this._board[testedWord.testPosition].solved = true;
          this._board[testedWord.testPosition].wrong = false;

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
          return;
        } else {
          // Word is wrong, not solved
          this._board[testedWord.testPosition].solved = false;
          this._board[testedWord.testPosition].wrong = true;

          this._message = testedWord.error;
        }
      },
      error: (err) => {
        // An error happened trying to get words

        // Test is done
        this._board[testPosition].testing = false;

        // The test word is broken
        this._board[testPosition].broken = true;

        // Show a message
        this._message =
          'Failed to communicate with the server, please try again later.';

        console.log('Error testing word: ' + JSON.stringify(err));
      },
    });
  }

  // Async call to test the whole puzzle
  // I think I'm going to use this to report a completion
  private win() {
    this._gameStatus = 'win';
    this._message = '!!! YOU WIN !!!';
  }

  // Get a hint for the current word
  // Send the request in without the current word.  When the reply comes back, clear
  // the word and put that letter in the right place.
  public getHint() {
    // Output from remote call
    let wordHint: WordHint;

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

    // Make the remote call
    this.dataService.getHint(wordArray, hintPosition).subscribe({
      next: (wordHint) => {
        console.log('Got hint: ' + JSON.stringify(wordHint));
        // Test is done
        this._board[wordHint.hintWord].testing = false;
        // The test word is not broken
        this._board[wordHint.hintWord].broken = false;

        if (wordHint.valid) {
          // Word is solved, not wrong
          this._board[wordHint.hintWord].solved = false;
          this._board[wordHint.hintWord].wrong = false;

          // Plug in the hint by moving to the cell and typing (to get other events)
          this.setSelectedCell(wordHint.hintWord, wordHint.hintPosition);
          this.letterEntered(wordHint.hintLetter);

          return;
        } else {
          // Couldn't get a hint, tell the player
          this._message = wordHint.error;
        }
      },
      error: (err) => {
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
    });
  }

  // Set the selected cell
  public setSelectedCell(word, letter) {
    // Only move the selection if the word isn't locked
    if (!this._board[word].locked) {
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
}
