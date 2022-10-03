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
  private _board = [];

  // Parameters of the game
  private numLetters: number = 3;
  private numHops: number = 5;

  // Selected row/cell indexes
  private _selectedWord: number = 1;
  private _selectedLetter: number = 0;

  constructor(private dataService: DataService) {
    this.newGame();
  }

  // Word pair retrieved from the server
  wordPair: WordPair | undefined;

  newGame() {
    console.log('Requesting word pair...');
    this.dataService
      .getPair(this.numLetters, this.numHops)
      // clone the data object, using its known Config shape
      .subscribe((data: WordPair) => (this.wordPair = { ...data }));

    this.dataService
      .getPair(this.numLetters, this.numHops)
      // resp is of type `HttpResponse<WordPair>`
      .subscribe((wordpair) => {
        this.wordPair = { ...wordpair };

        console.log('Got wordpair: ' + JSON.stringify(this.wordPair));
        this._board = this.createBoard();
      });
  }

  private createBoard() {
    // Create a 2d board holding correct number words and letters each / all nulls
    let board = [];
    for (let i = 0; i < this.wordPair.words; i++) {
      board[i] = {
        letters: [],
        locked: false,
        solved: false,
        wrong: false,
      };
      for (let j = 0; j < this.wordPair.letters; j++) {
        board[i].letters.push(null);
      }
    }

    // Fill in the first & last words on the board
    board[0].locked = true; // Can't change the start word
    board[this.wordPair.hops].locked = true; // Can't change the end word
    for (let j = 0; j < this.numLetters; j++) {
      board[0].letters[j] = this.wordPair.startWord.charAt(j);
      board[this.numHops].letters[j] = this.wordPair.endWord.charAt(j);
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
          // Output from remote call
          let testedWord: TestedWord;

          // Inputs to remote call
          let wordArray = [];
          for (const word of this._board) {
            wordArray.push(word.letters.join(''));
          }
          let testWord = this._board[this._selectedWord].letters.join('');
          let testPosition = this._selectedWord;

          // Make the remote call
          this.dataService
            .testWord(wordArray, testWord, testPosition)
            .subscribe((resp) => {
              testedWord = { ...resp };

              console.log('Word Test: ' + testedWord.valid);
              this._board = this.createBoard();
            });

          // Test this word to see if it's valid
          let validWord = true;
          // let validWord = this.dataService.testWord(
          //   this._board[this._selectedWord].letters.join('')
          // );
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
            let validPuzzle = this.dataService.testPuzzle(this._board);
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
