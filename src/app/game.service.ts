import { Injectable } from '@angular/core';

@Injectable()
export class GameService {
  // The game board - array of words
  // Each word has:
  //   .letters = array of the letters of the word
  //   .locked = true if this word cannot be changed
  //   .solved = true if this word is verified
  //   .wrong = word was tested and is wrong
  public board = [];

  // Parameters of the game
  numLetters: number = 3;
  numHops: number = 4;

  // Selected row/cell indexes
  selectedWord = 1;
  selectedLetter = 0;

  constructor() {
    this.newGame();
  }

  newGame() {
    this.board = this.createBoard();
  }

  createBoard() {
    let startWord = 'VIM';
    let endWord = 'OAT';

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

    // Fill in the first & last words
    board[0].locked = true; // Can't change these
    board[this.numHops].locked = true;
    for (let j = 0; j < this.numLetters; j++) {
      board[0].letters[j] = startWord.charAt(j);
      board[this.numHops].letters[j] = endWord.charAt(j);
    }

    return board;
  }

  // Test the whole puzzle
  testPuzzle(words: any[]): boolean {
    return true;
  }

  // Test a single word
  testWord(word: string): boolean {
    return true;
  }

  // Keyboard entry occurred
  letterEntered(letter: string) {
    // Backspace & Delete (mostly shared logic)
    if (letter === 'Backspace' || letter === '{bksp}' || letter === 'Delete') {
      // Remove the letter from the current cell
      this.board[this.selectedWord].letters[this.selectedLetter] = null;

      // When you delete or backspace, this word + all subsequent are no longer solved
      for (let i = this.selectedWord; i < this.numHops; i++) {
        this.board[i].solved = false;
      }

      // When you delete or backspace, this word is no longer wrong
      this.board[this.selectedWord].wrong = false;

      // Backspace moves the current cell where delete doesn't
      if (letter === 'Backspace' || letter === '{bksp}') {
        // Back up to the previous cell
        if (this.selectedLetter > 0) {
          // Same word, 1 char backwards
          this.selectedLetter--;
        }
      }

      return;
    }

    if (letter === 'Enter') {
      // If all letters of this word are filled in, test the word
      let filledIn = true;
      for (const letter of this.board[this.selectedWord].letters) {
        if (letter == null) {
          filledIn = false;
        }
      }
      if (filledIn) {
        // Test this word to see if it's valid
        let validWord = this.testWord(
          this.board[this.selectedWord].letters.join('')
        );
        if (validWord) {
          this.board[this.selectedWord].solved = true;

          // Move to the next word
          if (this.selectedWord < this.numHops - 1) {
            this.selectedWord++;
            this.selectedLetter = 0;
          }
        } else {
          this.board[this.selectedWord].wrong = true;
        }

        // If all words are valid, run the whole puzzle validation
        let puzzleFilledIn = true;
        for (const word of this.board) {
          if (word.locked == false && word.solved == false) {
            puzzleFilledIn = false;
          }
        }
        if (puzzleFilledIn) {
          // Validate the whole puzzle
          let validPuzzle = this.testPuzzle(this.board);
          if (validPuzzle) {
            console.log('YOU WIN!'); //TODO
          } else {
            // All words are marked valid but the puzzle is borked
            // This shouldn't happen but if it does, everything goes to invalid
            for (const word of this.board) {
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
      this.board[this.selectedWord].letters[this.selectedLetter] = letter;

      // When you change a letter, this word is no longer wrong
      this.board[this.selectedWord].wrong = false;

      // Move the input to the next appropriate cell
      if (this.selectedLetter === this.numLetters - 1) {
        // Move to check button
      } else {
        // Move 1 to the right
        this.selectedLetter++;
      }
    }
  }

  get getBoard() {
    return this.board;
  }

  set setBoard(board) {
    this.board = [...board];
  }

  get getSelectedWord() {
    return this.selectedWord;
  }
  set setSelectedWord(index) {
    this.selectedWord = index;
  }

  get getSelectedLetter() {
    return this.selectedLetter;
  }
  set setSelectedLetter(index) {
    this.selectedLetter = index;
  }
}
