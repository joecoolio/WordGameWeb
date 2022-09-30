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

    // Create a board holding (numHops + 1) words
    let board = [];
    board.push({ id: 0, word: startWord });
    // for (let i = 1; i < this.numHops; i++) {
    //   board.push({ id: i, word: 'xxx' });
    // }
    // board.push({ id: this.numHops, word: endWord });
    return board;
  }

  get getBoard() {
    return this.board;
  }

  set setBoard(board) {
    this.board = [...board];
  }
}
