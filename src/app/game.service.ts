import { Injectable } from '@angular/core';

@Injectable()
export class GameService {
  // The game board - array of words
  // Each word has:
  //   .letters = array of the letters of the word
  //   .locked = true if this word cannot be changed
  //   .solved = true if this word is verified
  public board = [];

  // Parameters of the game
  numLetters: number = 3;
  numHops: number = 4;

  // Selected row/cell indexes
  selectedWord = 0;
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

  // Keyboard entry occurred
  letterEntered(letter: string) {
    if (letter === 'Backspace') {
      // Remove the letter from the current cell
      this.board[this.selectedWord].letters[this.selectedLetter] = null;

      // Back up to the previous cell
      if (this.selectedLetter > 0) {
        // Same word, 1 char backwards
        this.selectedLetter--;
      }

      return;
    }

    // if (letter === "Enter") {
    //     checkGuess()
    //     return
    // }

    let found = letter.match(/[a-z]/gi);
    if (!found || found.length > 1) {
      // Invalid character
      return;
    } else {
      // Valid letter, put it in the appropriate cell
      this.board[this.selectedWord].letters[this.selectedLetter] = letter;

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
