import { Injectable } from '@angular/core';

@Injectable()
export class GameService {
  public board = [];
  numLetters: number = 3;
  numHops: number = 4;

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

  get getBoard() {
    return this.board;
  }

  set setBoard(board) {
    this.board = [...board];
  }
}
