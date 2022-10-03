import { Injectable } from '@angular/core';
import { DataService, WordPair, TestedWord } from './data.service';

@Injectable()
export class GameService {
  // The game board - array of words
  // Each word has:
  //   .letters = array of the letters of the word
  //   .locked = true if this word cannot be changed
  //   .solved = true if this word is verified
  //   .wrong = word was tested and is wrong
  //   .testing = word is currently being tested
  //   .loading = word is being loaded
  private _board = [];

  // Parameters of the game
  private numLetters: number = 3;
  private numHops: number = 5;

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
    console.log('Requesting word pair...');

    this._board = this.createEmptyBoard();
    this._message = 'Requesting a pair of words...';

    this.dataService
      .getPair(this.numLetters, this.numHops)
      // resp is of type `HttpResponse<WordPair>`
      .subscribe((wordpair) => {
        this.wordPair = { ...wordpair };

        console.log('Got wordpair: ' + JSON.stringify(this.wordPair));
        this.populateBoard();
        this._message = '';
      });
  }

  private createEmptyBoard() {
    // Create a 2d board holding correct number words and letters each / all nulls
    let board = [];
    for (let i = 0; i < this.numHops + 1; i++) {
      board[i] = {
        letters: [],
        locked: false,
        solved: false,
        wrong: false,
        testing: false,
        loading: false,
      };
      for (let j = 0; j < this.numLetters; j++) {
        board[i].letters.push(null);
      }
    }
    // First and last words are locked
    board[0].locked = true;
    board[this.numHops].locked = true;

    // First and last words are loading
    board[0].loading = true;
    board[this.numHops].loading = true;

    return board;
  }

  private populateBoard() {
    // Fill in the first & last words on the board
    for (let j = 0; j < this.numLetters; j++) {
      this.board[0].letters[j] = this.wordPair.startWord.charAt(j);
      this.board[this.numHops].letters[j] = this.wordPair.endWord.charAt(j);
    }

    // First and last words are not loading
    this.board[0].loading = false;
    this.board[this.numHops].loading = false;
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
        // Remove the letter from the current cell
        this._board[this._selectedWord].letters[this._selectedLetter] = null;

        // When you delete or backspace, this word + all subsequent are no longer solved
        for (let i = this._selectedWord; i < this.numHops; i++) {
          this._board[i].solved = false;
        }

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
        let filledIn = true;
        for (const letter of this._board[this._selectedWord].letters) {
          if (letter == null) {
            filledIn = false;
          }
        }
        if (filledIn) {
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

        // When you change a letter, this word is no longer wrong
        this._board[this._selectedWord].wrong = false;

        // When you change a letter, the previous message goes away
        this._message = '';

        // Move the input to the next appropriate cell
        if (this._selectedLetter === this.numLetters - 1) {
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
        if (this._selectedWord < this.numHops - 1) this._selectedWord++;
      }
      if (letter === 'ArrowLeft') {
        if (this._selectedLetter > 0) this._selectedLetter--;
      }
      if (letter === 'ArrowRight') {
        if (this._selectedLetter < this.numLetters - 1) this._selectedLetter++;
      }
    }
  }

  // Async call to test a single word
  private testSingleWord() {
    // Output from remote call
    let testedWord: TestedWord;

    // Inputs to remote call
    let wordArray = [];
    for (const word of this._board) {
      wordArray.push(word.letters.join(''));
    }
    let testWord = this._board[this._selectedWord].letters.join('');
    let testPosition = this._selectedWord;

    // Mark the word as currently being tested, not solved, not wrong
    this._board[this._selectedWord].testing = true;
    this._board[this._selectedWord].solved = false;
    this._board[this._selectedWord].wrong = false;

    // Make the remote call
    this.dataService
      .testWord(wordArray, testWord, testPosition)
      .subscribe((resp) => {
        testedWord = { ...resp };

        console.log('Word Test: ' + testedWord.testPosition);

        // Test is done
        this._board[testedWord.testPosition].testing = false;

        if (testedWord.valid) {
          // Word is solved, not wrong
          this._board[testedWord.testPosition].solved = true;
          this._board[testedWord.testPosition].wrong = false;

          // If all words are solved, you win
          let puzzleFilledIn = true;
          for (const word of this._board) {
            if (word.solved == false) {
              puzzleFilledIn = false;
            }
          }
          if (puzzleFilledIn) {
            // You win!  Call this to report the completion.
            this.testEntirePuzzle();
          } else {
            // Move to the next word (unless the user has already moved)
            if (this._selectedWord == testedWord.testPosition) {
              if (this._selectedWord < this.numHops - 1) {
                // Need to avoid moving to a solved word.
                // Start at the next word and move forwards.
                for (
                  let i = testedWord.testPosition + 1;
                  i < this.numHops - 1;
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
      });
  }

  // Async call to test the whole puzzle
  // I think I'm going to use this to report a completion
  private testEntirePuzzle() {
    // TODO
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

  get message() {
    return this._message;
  }
}
