import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

export interface WordPair {
  startWord: string;
  endWord: string;
  letters: number;
  hops: number;
  words: number;
}

export interface TestedWord {
  testPosition: number;
  valid: boolean;
  error: string;
}

@Injectable()
export class DataService {
  constructor(private http: HttpClient) {}

  // Get a new pair of words to play
  getPair(numLetters: number, numHops: number): Observable<WordPair> {
    const body = { letters: numLetters, hops: numHops };
    return this.http.post<WordPair>(
      'https://wordgame.mikebillings.com/api/v1/getWordPair',
      body
    );
  }
  // Test the whole puzzle
  testPuzzle(words: any[]): boolean {
    return true;
  }

  // Test a single word
  testWord(
    wordArray: string[],
    testWord: string,
    testPosition: number
  ): Observable<TestedWord> {
    const body = {
      puzzle: wordArray,
      testPosition: testPosition,
      testWord: testWord,
    };
    console.log(JSON.stringify(body));
    return this.http.post<TestedWord>(
      'https://wordgame.mikebillings.com/api/v1/testWord',
      body
    );
  }
}
