import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { filter, firstValueFrom, tap, timeout } from 'rxjs';

const AUTH_API = 'https://wordgameapi.mikebillings.com/api/v2';

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

export interface ValidatedPuzzle {
  valid: boolean;
  error: string;
}

export interface BasicHint {
  hintWord: number;
  hintPosition: number;
  hintLetter: string;
  valid: boolean;
  error: string;
}

export interface WholeWordHint {
  hintWord: number;
  hintText: string;
  valid: boolean;
  error: string;
}

export interface SolutionSet {
  solutions: string[][],
  valid: boolean;
  error: string;
}

export interface SettingsResult {
  name: string,
  numLetters: number,
  numHops: number,
  gameMode: number,
  difficultyLevel: number,
  hintType: number,
  enableSounds: boolean
}

// Timeout for remote calls
const HTTP_TIMEOUT: number = 5000;

@Injectable({
  providedIn: 'root',
})
export class DataService {
  constructor(private http: HttpClient) {}

  // Execution time in ms of last command
  private _lastExecutionTime: number;

  // Get user settings
  async getSettings(): Promise<HttpResponse<SettingsResult>> {
    return await firstValueFrom(
      this.http.post<SettingsResult>(
        AUTH_API + '/user/getSettings',
        "",
        { observe: 'response' }
      ).pipe(
        // takeUntil(this.componentIsDestroyed$),
        // takeUntil(this.cancelRestCall$),
        timeout(HTTP_TIMEOUT),
        // retry(3)
      )
    );
  }

  // Get user settings
  async saveSettings(settings: string): Promise<HttpResponse<void>> {
    const body = { settings: settings };
    return await firstValueFrom(
      this.http.post<void>(
        AUTH_API + '/user/saveSettings',
        body,
        { observe: 'response' }
      ).pipe(
        // takeUntil(this.componentIsDestroyed$),
        // takeUntil(this.cancelRestCall$),
        timeout(HTTP_TIMEOUT),
        // retry(3)
      )
    );
  }


  // Get a new pair of words to play
  async getPair(numLetters: number, numHops: number): Promise<WordPair> {
    const body = { letters: numLetters, hops: numHops };
    return await firstValueFrom(
      this.http.post<WordPair>(
        AUTH_API + '/game/getWordPair',
        body
      ).pipe(
        // takeUntil(this.componentIsDestroyed$),
        // takeUntil(this.cancelRestCall$),
        timeout(HTTP_TIMEOUT),
        // retry(3)
      )
    );
  }

  // Test the whole puzzle
  testPuzzle(words: any[]): boolean {
    return true;
  }

  // Test a single word
  async testWord(
    wordArray: string[],
    testWord: string,
    testPosition: number
  ): Promise<TestedWord> {
    const body = {
      puzzle: wordArray,
      testPosition: testPosition,
      testWord: testWord,
    };
    return await firstValueFrom(
      this.http.post<TestedWord>(
        AUTH_API + '/game/testWord',
        body
      ).pipe(
        timeout(HTTP_TIMEOUT)
      )
    );
  }

  // Test full puzzle
  async validatePuzzle(
    wordArray: string[]
  ): Promise<ValidatedPuzzle> {
    const body = {
      puzzle: wordArray
    };
    return await firstValueFrom(
      this.http.post<ValidatedPuzzle>(
        AUTH_API + '/game/validatePuzzle',
        body
      ).pipe(
        timeout(HTTP_TIMEOUT)
      )
    );
  }
  
  async getHint(wordArray: string[], hintPosition: number): Promise<BasicHint> {
    const body = {
      puzzle: wordArray,
      hintPosition: hintPosition,
    };
    console.log('Ask Hint: ' + JSON.stringify(body));
    return await firstValueFrom(
      this.http.post<BasicHint>(
        AUTH_API + '/game/getHint',
        body
      ).pipe(
        timeout(HTTP_TIMEOUT)
      )
    );
  }

  async getFullHint(wordArray: string[], hintPosition: number): Promise<WholeWordHint> {
    const body = {
      puzzle: wordArray,
      hintPosition: hintPosition,
    };
    console.log('Ask Hint: ' + JSON.stringify(body));
    return await firstValueFrom(
      this.http.post<WholeWordHint>(
        AUTH_API + '/game/getFullHint',
        body
      ).pipe(
        timeout(HTTP_TIMEOUT)
      )
    );
  }

  async getAllSolutions(wordArray: string[]): Promise<SolutionSet> {
    const body = {
      puzzle: wordArray,
    };
    console.log('Ask For Solutions: ' + JSON.stringify(body));
    return await firstValueFrom(
      this.http.post<SolutionSet>(
        AUTH_API + '/game/getAllSolutions',
        body
      ).pipe(
        timeout(HTTP_TIMEOUT)
      )
    );
  }

  public get lastExecutionTime(): number {
    return this._lastExecutionTime;
  }

}
