import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';

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

export interface BasicHint {
  hintWord: number;
  hintPosition: number;
  hintLetter: string;
  valid: boolean;
  error: string;
  executionTime: number;
}

export interface WholeWordHint {
  hintWord: number;
  hintText: string;
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
  async getPair(numLetters: number, numHops: number): Promise<WordPair> {
    const body = { letters: numLetters, hops: numHops };
    let retval = await firstValueFrom(
        this.http.post<WordPair>(
        'https://wordgameapi.mikebillings.com/api/v1/getWordPair',
        body
      // ).pipe(
        // takeUntil(this.componentIsDestroyed$),
        // takeUntil(this.cancelRestCall$),
        // timeout(30000),
        // retry(3)
      )
    );
    return retval;
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

  getHint(wordArray: string[], hintPosition: number): Observable<BasicHint> {
    const body = {
      puzzle: wordArray,
      hintPosition: hintPosition,
    };
    console.log('Ask Hint: ' + JSON.stringify(body));
    return this.http.post<BasicHint>(
      'https://wordgameapi.mikebillings.com/api/v1/getHint',
      body
    );
  }

  getFullHint(wordArray: string[], hintPosition: number): Observable<WholeWordHint> {
    const body = {
      puzzle: wordArray,
      hintPosition: hintPosition,
    };
    console.log('Ask Hint: ' + JSON.stringify(body));
    return this.http.post<WholeWordHint>(
      'https://wordgameapi.mikebillings.com/api/v1/getFullHint',
      body
    );
  }
}
