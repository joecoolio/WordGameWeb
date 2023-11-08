import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpHeaders } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';

const API_ROOT = 'https://wordgameapi.mikebillings.com/api/v2';

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
  errorCode: string;
  errorData: string[][];
}

export interface ValidatedPuzzle {
  valid: boolean;
  error: string;
  errorCode: string;
  errorData: string[][];
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
  numSolutions: number,
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
  enableSounds: boolean,
  showKeyboard: boolean,
  showDefinitions: boolean,
  fullscreen: boolean,
  language: string,
}

export interface Leader {
  rank: number,
  name: string,
  score: number
}

export interface PlayerStats {
  letters: number,
  hops: number,
  totalGames: number,
  wins: number,
  losses: number,
  fastestWin: number
}

// HTTP options
export const headers = new HttpHeaders();
headers.append('Content-Type', 'application/json; charset=utf-8');

// Timeout for remote calls
const HTTP_TIMEOUT: number = 5000;

@Injectable({
  providedIn: 'root',
})
export class DataService {
  constructor(private http: HttpClient) {}

  // Get user settings
  async getSettings(): Promise<HttpResponse<SettingsResult>> {
    return await firstValueFrom(
      this.http.post<SettingsResult>(
        API_ROOT + '/user/getSettings',
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
        API_ROOT + '/user/saveSettings',
        body,
        { observe: 'response', headers: headers }
      ).pipe(
        // takeUntil(this.componentIsDestroyed$),
        // takeUntil(this.cancelRestCall$),
        timeout(HTTP_TIMEOUT),
        // retry(3)
      )
    );
  }


  // Get a new pair of words to play
  async getPair(language: string, numLetters: number, numHops: number): Promise<WordPair> {
    const body = {
      language: language,
      letters: numLetters,
      hops: numHops
    };

    // return {
    //   startWord: "OIT",
    //   endWord: "SÛT",
    //   letters: 3,
    //   hops: 3,
    //   words: 4
    // }
    return await firstValueFrom(
      this.http.post<WordPair>(
        API_ROOT + '/game/getWordPair',
        body,
        { headers: headers }
      ).pipe(
        // takeUntil(this.componentIsDestroyed$),
        // takeUntil(this.cancelRestCall$),
        timeout(HTTP_TIMEOUT),
        // retry(3)
      )
    );
  }

  // Test the whole puzzle
  testPuzzle(language: string, words: any[]): boolean {
    return true; //TODO
  }

  // Test a single word
  async testWord(
    language: string,
    wordArray: string[],
    testWord: string,
    testPosition: number
  ): Promise<TestedWord> {
    const body = {
      language: language,
      puzzle: wordArray,
      testPosition: testPosition,
      testWord: testWord,
    };
    return await firstValueFrom(
      this.http.post<TestedWord>(
        API_ROOT + '/game/testWord',
        body,
      ).pipe(
        timeout(HTTP_TIMEOUT)
      )
    );

  }

  // Test full puzzle
  async validatePuzzle(
    language: string,
    wordArray: string[]
  ): Promise<ValidatedPuzzle> {
    const body = {
      language: language,
      puzzle: wordArray
    };
    return await firstValueFrom(
      this.http.post<ValidatedPuzzle>(
        API_ROOT + '/game/validatePuzzle',
        body,
        { headers: headers }
      ).pipe(
        timeout(HTTP_TIMEOUT)
      )
    );
  }
  
  async getHint(language: string, wordArray: string[], hintPosition: number): Promise<BasicHint> {
    const body = {
      language: language,
      puzzle: wordArray,
      hintPosition: hintPosition,
    };
    console.log('Ask Hint: ' + JSON.stringify(body));
    return await firstValueFrom(
      this.http.post<BasicHint>(
        API_ROOT + '/game/getHint',
        body,
        { headers: headers }
      ).pipe(
        timeout(HTTP_TIMEOUT)
      )
    );
  }

  async getFullHint(language: string, wordArray: string[], hintPosition: number): Promise<WholeWordHint> {
    const body = {
      language: language,
      puzzle: wordArray,
      hintPosition: hintPosition,
    };
    console.log('Ask Hint: ' + JSON.stringify(body));
    return await firstValueFrom(
      this.http.post<WholeWordHint>(
        API_ROOT + '/game/getFullHint',
        body,
        { headers: headers }
      ).pipe(
        timeout(HTTP_TIMEOUT)
      )
    );
  }

  async getAllSolutions(language: string, wordArray: string[]): Promise<SolutionSet> {
    const body = {
      language: language,
      puzzle: wordArray,
      countOnly: false
    };
    console.log('Ask For Solutions: ' + JSON.stringify(body));
    return await firstValueFrom(
      this.http.post<SolutionSet>(
        API_ROOT + '/game/getAllSolutions',
        body,
        { headers: headers }
      ).pipe(
        timeout(HTTP_TIMEOUT)
      )
    );
  }

  async getSolutionCount(language: string, wordArray: string[]): Promise<SolutionSet> {
    const body = {
      language: language,
      puzzle: wordArray,
      countOnly: true
    };
    console.log('Ask For Solutions: ' + JSON.stringify(body));
    return await firstValueFrom(
      this.http.post<SolutionSet>(
        API_ROOT + '/game/getAllSolutions',
        body,
        { headers: headers }
      ).pipe(
        timeout(HTTP_TIMEOUT)
      )
    );
  }

  async recordNewGame(gameId: string, language: string, pair: string, letters: number, hops: number, gameMode: number, difficultyLevel: number): Promise<void> {
    const body = {
      gameId: gameId,
      language: language,
      pair: pair,
      letters: letters,
      hops: hops,
      gameMode: gameMode,
      difficultyLevel: difficultyLevel
    };
    console.log('DataService: Record new game: ' + JSON.stringify(body));
    return await firstValueFrom(
      this.http.post<void>(
        API_ROOT + '/game/recordNewGame',
        body,
        { headers: headers }
      ).pipe(
        timeout(HTTP_TIMEOUT)
      )
    );
  }

  async recordGameResult(gameId: string, result: string, numHints: number, execMs: number): Promise<void> {
    let apiPath = "";
    switch (result) {
      case 'win': apiPath = 'recordGameWin'; break;
      case 'loss': apiPath = 'recordGameLoss'; break;
      case 'abandon': apiPath = 'recordGameAbandon'; break;
    }
    const body = {
      gameId: gameId,
      numHints: numHints,
      execMs: execMs
    };
    console.log('DataService: Record game result: ' + apiPath + " = " + JSON.stringify(body));
    return await firstValueFrom(
      this.http.post<void>(
        API_ROOT + '/game/' + apiPath,
        body,
        { headers: headers }
      ).pipe(
        timeout(HTTP_TIMEOUT)
      )
    );
  }

  async getLeaderboard(letters: number, hops: number, boardname: string): Promise<Leader[]> {
    // Sort high to low except for the fastest win list
    let lowToHigh = boardname === "fastestwin";

    const body = {
      letters: letters,
      hops: hops,
      boardname: boardname,
      lowToHigh: lowToHigh
    };
    console.log('DataService: Get leaderboard: ' + JSON.stringify(body));
    return await firstValueFrom(
      this.http.post<Leader[]>(
        API_ROOT + '/game/leaderboard',
        body,
        { headers: headers }
      ).pipe(
        timeout(HTTP_TIMEOUT)
      )
    );
  }

  async getStats(): Promise<PlayerStats[]> {
    console.log('DataService: Get stats');
    return await firstValueFrom(
      this.http.post<PlayerStats[]>(
        API_ROOT + '/game/stats',
        "",
        { headers: headers }
      ).pipe(
        timeout(HTTP_TIMEOUT)
      )
    );
  }

}
