import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { filter, firstValueFrom, tap, timeout } from 'rxjs';

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

export interface LoginResult {
  result: boolean,
  error: string,
  email: string,
  jwt: string,
  settings: string
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

  // Get a new pair of words to play
  async getPair(numLetters: number, numHops: number): Promise<WordPair> {
    const body = { letters: numLetters, hops: numHops };
    return await firstValueFrom(
      this.http.post<WordPair>(
        'https://wordgameapi.mikebillings.com/api/v1/game/getWordPair',
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
        'https://wordgameapi.mikebillings.com/api/v1/game/testWord',
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
        'https://wordgameapi.mikebillings.com/api/v1/game/validatePuzzle',
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
        'https://wordgameapi.mikebillings.com/api/v1/game/getHint',
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
        'https://wordgameapi.mikebillings.com/api/v1/game/getFullHint',
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
        'https://wordgameapi.mikebillings.com/api/v1/game/getAllSolutions',
        body
      ).pipe(
        timeout(HTTP_TIMEOUT)
      )
    );
  }

  async login(email: string, password: string): Promise<HttpResponse<LoginResult>> {
    const body = {
      email: email,
      password: password
    };
    console.log('Dataservice Login: ' + JSON.stringify(body));
    return await firstValueFrom(
      this.http.post<LoginResult>(
        'https://wordgameapi.mikebillings.com/api/v1/auth/login',
        body,
        { observe: 'response' }
      ).pipe(
        timeout(HTTP_TIMEOUT),
        filter(event => event instanceof HttpResponse),
        tap<HttpResponse<any>>(
          response => {
            this._lastExecutionTime = parseFloat(response.headers.get('ExecutionTime'));
            console.log("exec time:", this._lastExecutionTime);
          }
        )
      )
    );
  }

  async register(
    email: string,
    password: string,
    settings: string // JSON format
  ): Promise<HttpResponse<LoginResult>> {
    const body = {
      email: email,
      password: password,
      settings: settings
    };
    console.log('Dataservice Register: ' + JSON.stringify(body));
    return await firstValueFrom(
      this.http.post<LoginResult>(
        'https://wordgameapi.mikebillings.com/api/v1/auth/register',
        body,
        { observe: 'response' }
      ).pipe(
        timeout(HTTP_TIMEOUT),
        filter(event => event instanceof HttpResponse),
        tap<HttpResponse<any>>(
          response => {
            this._lastExecutionTime = parseFloat(response.headers.get('ExecutionTime'))
          }
        )
      )
    );
  }

  public get lastExecutionTime(): number {
    return this._lastExecutionTime;
  }

}
