import { Injectable } from '@angular/core';

@Injectable()
export class GameService {
  // The game board
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
      board[i] = [];
      for (let j = 0; j < this.numLetters; j++) {
        board[i].push(null);
      }
    }

    // Put the first & last words in
    for (let j = 0; j < this.numLetters; j++) {
      board[0][j] = startWord.charAt(j);
      board[this.numHops][j] = endWord.charAt(j);
    }

    return board;
  }

  // Keyboard entry occurred
  letterEntered(letter: string) {
    // Draw the letter in the box
    this.board[this.selectedWord][this.selectedLetter] = letter;

    // Move to the next box
    if (this.selectedLetter == this.numLetters - 1) {
      this.selectedWord++;
      this.selectedLetter = 0;
    } else {
      this.selectedLetter++;
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
