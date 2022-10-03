import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

@Injectable()
export class DataService {
  constructor(private http: HttpClient) {}

  // Get a new pair of words to play
  getPair(numLetters: number, numHops: number): string[] {
    const body = { letters: numLetters, hops: numHops };
    console.log(body);
    this.http
      .post<any>('https://wordgame.mikebillings.com/api/v1/getWordPair', body)
      .subscribe((data) => {
        console.log(data);
      });
    return ['ABUT', 'APEX'];
  }
  // Test the whole puzzle
  testPuzzle(words: any[]): boolean {
    return true;
  }

  // Test a single word
  testWord(word: string): boolean {
    return true;
  }
}
