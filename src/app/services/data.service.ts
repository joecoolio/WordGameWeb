import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';

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

export interface ValidatedPuzzle {
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

export interface SolutionSet {
  solutions: string[][],
  valid: boolean;
  error: string;
  executionTime: number;
}

export interface LoginResult {
  success: boolean,
  email: string,
  name: string,
  numLetters: number,
  numHops: number,
  gameMode: number,
  difficultyLevel: number,
  hintType: number,
  enableSounds: true
}

// Timeout for remote calls
const HTTP_TIMEOUT: number = 5000;

@Injectable({
  providedIn: 'root',
})
export class DataService {
  constructor(private http: HttpClient) {}

  // Get a new pair of words to play
  async getPair(numLetters: number, numHops: number): Promise<WordPair> {
    const body = { letters: numLetters, hops: numHops };
    return await firstValueFrom(
      this.http.post<WordPair>(
        'https://wordgameapi.mikebillings.com/api/v1/getWordPair',
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
        'https://wordgameapi.mikebillings.com/api/v1/testWord',
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
        'https://wordgameapi.mikebillings.com/api/v1/validatePuzzle',
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
        'https://wordgameapi.mikebillings.com/api/v1/getHint',
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
        'https://wordgameapi.mikebillings.com/api/v1/getFullHint',
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
        'https://wordgameapi.mikebillings.com/api/v1/getAllSolutions',
        body
      ).pipe(
        timeout(HTTP_TIMEOUT)
      )
    );
  }

  async login(email: string, password: string): Promise<LoginResult> {
    const body = {
      email: email,
      password: password
    };
    console.log('Login: ' + JSON.stringify(body));
    return await firstValueFrom(
      this.http.post<LoginResult>(
        'https://wordgameapi.mikebillings.com/api/v1/login',
        body
      ).pipe(
        timeout(HTTP_TIMEOUT)
      )
    );
  }

  async register(
    email: string,
    password: string,
    name: string,
    numLetters: number,
    numHops: number,
    gameMode: number,
    difficultyLevel: number,
    hintType: number,
    enableSounds: boolean
  ): Promise<LoginResult> {
    const body = {
      email: email,
      password: password,
      name: name,
      numLetters: numLetters,
      numHops: numHops,
      gameMode: gameMode,
      difficultyLevel: difficultyLevel,
      hintType: hintType,
      enableSounds: enableSounds
    };
    console.log('Login: ' + JSON.stringify(body));
    return await firstValueFrom(
      this.http.post<LoginResult>(
        'https://wordgameapi.mikebillings.com/api/v1/register',
        body
      ).pipe(
        timeout(HTTP_TIMEOUT)
      )
    );
  }

}
