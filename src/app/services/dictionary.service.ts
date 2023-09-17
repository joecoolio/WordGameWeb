import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { filter, firstValueFrom, map, Observable, tap, timeout } from 'rxjs';

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
            partOfSpeech: string,
            definitions: {
                definition: string,
                example: string,
                synonyms: string,
                antonyms: string
            }[]
        }
    ],
}

// An individual word meaning
export interface WordMeaning {
    partofSpeech: string, // Noun, Verb, Adjective, Adverb, Conjunction, Interjection, Numeral, Pronoun, Preposition
    posShorthand: string, // N, V, ADJ, ADV, CON, INT, NUM, PRO, PRE
    definition: string,
}
// A dictionary word and all the meanings of it
export interface DictionaryWord {
    word: string,
    meanings: WordMeaning[]
}

@Injectable({
  providedIn: 'root'
})
export class DictionaryService {
    constructor(private http: HttpClient) { }

    async lookup(word: string): Promise<DictionaryWord> {
        return await firstValueFrom(
            this.http.get<DictionaryResult[]>(
                DICTIONARY_API + word,
                { observe: 'response' }
            ).pipe(
                timeout(HTTP_TIMEOUT),
                filter(event => event instanceof HttpResponse),
                map(response => {
                    if (response.status == 200) {
                        // Word to return
                        let returnWord: DictionaryWord = { word: word, meanings: [] };

                        // I only want 1 noun, 1 verb, etc. regardless of how many definitions there are.
                        // As I find one, put it in here so I don't add another
                        let foundTypes: string[] = [];

                        let result: DictionaryResult[] = response.body;
                        result.forEach((toplevel) => {
                            toplevel.meanings.forEach((meaning) => {
                                let partOfSpeech: string = meaning.partOfSpeech;

                                meaning.definitions.forEach((definition) => {
                                    // Not sure what these are, but they're not legit definitions
                                    if (!definition.definition.startsWith("(auxiliary)")) {
                                        // Only keep the first of each type
                                        if (!foundTypes.includes(partOfSpeech)) {
                                            foundTypes.push(partOfSpeech);

                                            // Build a word meaning
                                            let wordMeaning: WordMeaning = { partofSpeech: partOfSpeech, posShorthand: "", definition: definition.definition };
                                            // Shorthand part of speech for the UI
                                            switch(partOfSpeech) {
                                                case "noun": wordMeaning.posShorthand = "N"; break;
                                                case "verb": wordMeaning.posShorthand = "V"; break;
                                                case "adjective": wordMeaning.posShorthand = "ADJ"; break;
                                                case "adverb": wordMeaning.posShorthand = "ADV"; break;
                                                case "conjunction": wordMeaning.posShorthand = "CON"; break;
                                                case "interjection": wordMeaning.posShorthand = "INT"; break;
                                                case "numeral": wordMeaning.posShorthand = "NUM"; break;
                                                case "pronoun": wordMeaning.posShorthand = "PRO"; break;
                                                case "preposition": wordMeaning.posShorthand = "PRE"; break;
                                                default: wordMeaning.posShorthand = "?";
                                            }

                                            returnWord.meanings.push(wordMeaning);
                                        }
                                    }
                                });
                            });
                        });

                        return returnWord;
                    }
                })
            )
        );
    }
}
