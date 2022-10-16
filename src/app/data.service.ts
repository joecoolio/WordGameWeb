import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

export interface UserSettings {
  userid: string, // User ID
  letters: number, // Number of letters
  hops: number, // Number of hops

  
}

export interface WordPair {
  startWord: string;
  endWord: string;
  letters: number;
  hops: number;
  words: number;
  executionTime: number;
}

export interface TestedWord {
  testPosition: number;
  valid: boolean;
  error: string;
  executionTime: number;
}

export interface WordHint {
  hintWord: number;
  hintPosition: number;
  hintLetter: string;
  valid: boolean;
  error: string;
  executionTime: number;
}

@Injectable({
  providedIn: 'root',
})
export class DataService {
  constructor(private http: HttpClient) {}

  // Get a new pair of words to play
  getPair(numLetters: number, numHops: number): Observable<WordPair> {
    const body = { letters: numLetters, hops: numHops };
    return this.http.post<WordPair>(
      'https://wordgameapi.mikebillings.com/api/v1/getWordPair',
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
    return this.http.post<TestedWord>(
      'https://wordgameapi.mikebillings.com/api/v1/testWord',
      body
    );
  }

  getHint(wordArray: string[], hintPosition: number): Observable<WordHint> {
    const body = {
      puzzle: wordArray,
      hintPosition: hintPosition,
    };
    console.log('Ask Hint: ' + JSON.stringify(body));
    return this.http.post<WordHint>(
      'https://wordgameapi.mikebillings.com/api/v1/getHint',
      body
    );
  }
}
