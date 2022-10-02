import { Injectable } from '@angular/core';

@Injectable()
export class GameService {
  // The game board - array of words
  // Each word has:
  //   .letters = array of the letters of the word
  //   .locked = true if this word cannot be changed
  //   .solved = true if this word is verified
  //   .wrong = word was tested and is wrong
  private _board = [];

  // Parameters of the game
  private numLetters: number = 4;
  private numHops: number = 3;

  // Selected row/cell indexes
  private _selectedWord: number = 1;
  private _selectedLetter: number = 0;

  /////
  // REST calls
  /////

  // Get a new pair of words to play
  private getPair(numLetters: number, numHops: number): string[] {
    return ['ABUT', 'APEX'];
  }
  // Test the whole puzzle
  testPuzzle(words: any[]): boolean {
    return true;
  }

  // Test a single word
  testWord(word: string): boolean {
    return true;
  }

  /////
  // End REST calls
  /////

  constructor() {
    this.newGame();
  }

  newGame() {
    this._board = this.createBoard();
  }

  createBoard() {
    // Get a pair of words from the server
    let pairArray = this.getPair(this.numLetters, this.numHops);
    let startWord = pairArray[0];
    let endWord = pairArray[1];

    // Create a 2d board holding (numHops + 1) words of numLetters each / all nulls
    let board = [];
    for (let i = 0; i < this.numHops + 1; i++) {
      board[i] = {
        letters: [],
        locked: false,
        solved: false,
        wrong: false,
      };
      for (let j = 0; j < this.numLetters; j++) {
        board[i].letters.push(null);
      }
    }

    // Fill in the first & last words on the board
    board[0].locked = true; // Can't change the start word
    board[this.numHops].locked = true; // Can't change the end word
    for (let j = 0; j < this.numLetters; j++) {
      board[0].letters[j] = startWord.charAt(j);
      board[this.numHops].letters[j] = endWord.charAt(j);
    }

    return board;
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

      if (letter === 'Enter') {
        // If all letters of this word are filled in, test the word
        let filledIn = true;
        for (const letter of this._board[this._selectedWord].letters) {
          if (letter == null) {
            filledIn = false;
          }
        }
        if (filledIn) {
          // Test this word to see if it's valid
          let validWord = this.testWord(
            this._board[this._selectedWord].letters.join('')
          );
          if (validWord) {
            this._board[this._selectedWord].solved = true;

            // Move to the next word
            if (this._selectedWord < this.numHops - 1) {
              this._selectedWord++;
              this._selectedLetter = 0;
            }
          } else {
            this._board[this._selectedWord].wrong = true;
          }

          // If all words are valid, run the whole puzzle validation
          let puzzleFilledIn = true;
          for (const word of this._board) {
            if (word.locked == false && word.solved == false) {
              puzzleFilledIn = false;
            }
          }
          if (puzzleFilledIn) {
            // Validate the whole puzzle
            let validPuzzle = this.testPuzzle(this._board);
            if (validPuzzle) {
              console.log('YOU WIN!'); //TODO
            } else {
              // All words are marked valid but the puzzle is borked
              // This shouldn't happen but if it does, everything goes to invalid
              for (const word of this._board) {
                word.solved = true;
              }
            }
          }
          return;
        }
      }

      let found = letter.match(/[a-z]/gi);
      if (!found || found.length > 1) {
        // Invalid character
        return;
      } else {
        // Valid letter, put it in the appropriate cell
        this._board[this._selectedWord].letters[this._selectedLetter] = letter;

        // When you change a letter, this word is no longer wrong
        this._board[this._selectedWord].wrong = false;

        // Move the input to the next appropriate cell
        if (this._selectedLetter === this.numLetters - 1) {
          // Move to check button
        } else {
          // Move 1 to the right
          this._selectedLetter++;
        }
      }
    }
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

  get selectedLetter() {
    return this._selectedLetter;
  }
}
