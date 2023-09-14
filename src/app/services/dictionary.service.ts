import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { filter, firstValueFrom, Observable, tap, timeout } from 'rxjs';

const DICTIONARY_API = 'https://api.dictionaryapi.dev/api/v2/entries/en/';

// Timeout for remote calls
const HTTP_TIMEOUT: number = 3000;

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

export interface DictionaryResult {
    word: string,
    phonetic: string,
    phonetics: {
        text: string,
        audio: string
    }[],
    origin: string,
    meanings: [
        {
            partofSpeech: string,
            definitions: {
                definition: string,
                example: string,
                synonyms: string,
                antonyms: string
            }[]
        }
    ],
}

// export interface WordMeaning {
//     partofSpeech: string,
//     definition: string,
//     synonyms: string,
//     antonyms: string
// }
// export interface DictionaryWord {
//     word: string,
//     phonetic: string,
//     meanings: WordMeaning[]
// }

@Injectable({
  providedIn: 'root'
})
export class DictionaryService {
    constructor(private http: HttpClient) { }

    async lookup(word: string): Promise<DictionaryResult[]> {
        return await firstValueFrom(
            this.http.get<DictionaryResult[]>(
            DICTIONARY_API + word,
            ).pipe(
                timeout(HTTP_TIMEOUT)
            )
        );

        // // Words to return
        // let returnWords:DictionaryWord[] = [];

        // // A single word
        // let returnWord: DictionaryWord = {
        //     word: "", phonetic: "", meanings: []
        // };

        // if (result.length > 0) {
        //     returnWord.word = result[0].word ? result[0].word : "";
        //     returnWord.phonetic = result[0].phonetic ? result[0].phonetic : "";
            

        //     result[0].meanings.forEach((meaning) => {
        //         let wordMeaning: WordMeaning = {
        //             partofSpeech: "", definition: "", synonyms: "", antonyms: ""
        //         };
        //         wordMeaning.partofSpeech = meaning.partofSpeech ? result[0].meanings[0].partofSpeech : "";
        //         wordMeaning.definition = meaning.definitions[0].definition ? result[0].meanings[0].definitions[0].definition : "";
        //         wordMeaning.synonyms = meaning.definitions[0].synonyms ? result[0].meanings[0].definitions[0].synonyms : "";
        //         wordMeaning.antonyms = meaning.definitions[0].antonyms ? result[0].meanings[0].definitions[0].antonyms : "";

        //         returnWord.meanings.push(wordMeaning);
        //     });
        // }

        // return returnWord;
    }

}
