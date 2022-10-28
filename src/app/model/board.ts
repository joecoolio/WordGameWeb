import { start } from "@popperjs/core";
import { Subscription, timer } from "rxjs";

// Status of a word at any point in time
export enum WordStatus {
    Initialized,  // Nothing to report, default status
    Solved,       // Verified as correct
    Wrong,        // Verified as wrong
    Testing,      // Currently being tested
    Loading,      // Currently being loaded
    Broken        // Something broke while talking to the server, try again
}

// A game board
export class Board {
    // Number of letters in each word
    private readonly _numLetters: number;

    // Number of hops in the game (always 1 less than the number of words)
    private readonly _numHops: number;

    // If there is a server problem (or whatever), the game is broken
    private _broken: boolean;

    // Array of words
    private _words: Word[];

    // Array of solutions
    private _solutions: Solution[];

    constructor(numLetters: number, numHops: number) {
        this._numLetters = numLetters;
        this._numHops = numHops;
        this._broken = false;
        this._solutions = [];

        this._words = [];
        for(let i = 0; i < numHops + 1; i++) {
            this._words.push(new Word(numLetters));
        }

        // Preconfigure pair words
        this._words[0].locked = true;
        this._words[0].pairWord = true;
        this._words[this.numHops].locked = true;
        this._words[this.numHops].pairWord = true;
    };

    // Initialize the game with a pair of words
    initialize(startWord: string, endWord: string) {
        // Can't set letters while the word is locked
        this._words[0].locked = false;
        this._words[0].setText(startWord);
        this._words[0].locked = true;

        this._words[this.numHops].locked = false;
        this._words[this.numHops].setText(endWord);
        this._words[this.numHops].locked = true;

        // Pair words are not user entered
        this._words[0].letters.forEach((letter) => { letter.userEntered = false; });
        this._words[this.numHops].letters.forEach((letter) => { letter.userEntered = false; });
    }

    stringify(): string {
        return Helper.stringify(this._words);
    }

    // Set first & last word to status
    setPairWordStatus(status: WordStatus) {
        this._words[0].status = status;
        this._words[this.numHops].status = status;
    }

    // Set user words to status
    setUserWordStatus(status: WordStatus) {
        for (let i = 1; i < this.numHops; i++) {
            this._words[i].status = status;
        }
    }

    // Is every word populated?
    allWordsPopulated(): boolean {
        for (const word of this._words) {
            if (!word.populated) {
                return false;
            }
        }
        return true;
    }
    
    // Add a solution to this board
    addSolution(wordArray: string[]) {
        let solution: Solution = new Solution(wordArray);
        this._solutions.push(solution);
        console.log("New solution added: " + solution.stringify());
    }

    cycleThroughSolutions(): Subscription {
        // Which solution to show (this increments and cyles)
        let solutionToShow: number = 0;

        // Setup a timer so we can toggle the board letters with a solution every 5 seconds
        let showSolutionSubscription: Subscription = timer(3000, 5000).subscribe(
            event => {
                // This executes when it's time to switch to the solution overlay
                // console.log("Flipping to: #" + solutionToShow + ": " + this._solutions[solutionToShow].stringify());

                // Solution to show
                let solution = this._solutions[solutionToShow];

                // Backup the puzzle words so we can flip back
                let puzzleWords = this._words;

                // Change the words to the solution overlay
                this._words = solution.overlayOnPuzzle(puzzleWords);
                
                // Increment the solution to show next time
                solutionToShow = (solutionToShow < this._solutions.length - 1) ? solutionToShow+1 : 0;

                // Setup a one-time timer to flip back to the puzzle after 2 seconds
                let showOriginalSubscription: Subscription = timer(2000).subscribe(
                    event => {
                        this._words = puzzleWords;
                        // console.log("Flipping back to puzzle: " + this.stringify());
                        
                        showOriginalSubscription.unsubscribe;
                    }
                );
                
                // Add original subscription to solution subscription
                // This way, everything gets unsubscribed together
                showSolutionSubscription.add(showOriginalSubscription);
            }
        );
        
        // Set the flip subscription to be unsubscribed when the game is disposed
        return showSolutionSubscription;
    }

    // Number of words on the board always = hops + 1
    public get numWords(): number {
        return this._numHops + 1;
    }
    public get numLetters(): number {
        return this._numLetters;
    }
    public get numHops(): number {
        return this._numHops;
    }
    public get words(): Word[] {
        return this._words;
    }
}

// A single word
export class Word {
    // Number of letters
    protected readonly _length: number;
    
    // Set of letters
    protected readonly _letters: Letter[];

    // Can the word be changed
    private _locked: boolean;

    // Is this word one of the pair words
    private _pairWord: boolean;

    // Current word status
    private _status: WordStatus;

    // All letters in this word are fully populated
    protected _populated: boolean;

    constructor(length: number) {
        this._length = length;
        this._locked = false;
        this._status = WordStatus.Initialized;
        this._populated = false;

        this._letters = [];

        this.populateLetters();
    }

    // Populate the letters of the word
    // Override to populate them with something different than null letters
    // or if you're creating non-user-entered letters for a solution
    protected populateLetters() {
        for(let i = 0; i < this._length; i++) {
            this._letters.push(new Letter(true, ()=> { this.checkPopulated(); }));
        }
    }

    // Set the entire text of a word
    setText(wordText: string) {
        let letterArray = Array.from(wordText);
        for(let i = 0; i < this._length; i++) {
            this._letters[i].character = letterArray[i];
        }
    }

    // Check if all the letters are populated and reflect that in the word
    public checkPopulated() {
        let temp: boolean = true;
        for(let i = 0; i < this._length; i++) {
            if (this._letters[i].character == null) {
                temp = false;
                break;
            }
        }
        this._populated = temp;

        // Also, the word can't be solved or wrong after a change
        this._status = WordStatus.Initialized;
    }

    public stringify(): string {
        let temp: string = "";
        for(let i = 0; i < this._letters.length; i++) {
            if (this._letters[i].character != null) {
                if (this._letters[i].userEntered) {
                    temp += this._letters[i].character;
                } else {
                    temp += this._letters[i].character;
                }
            } else {
                temp += " ";
            }
        }

        // Replace spaces with null
        if (temp != " ".repeat(this._letters.length)) {
            return temp;
        } else {
            return null;
        }
    }
    public get length(): number {
        return this._length;
    }
    public get letters(): Letter[] {
        return this._letters;
    }
    public get locked(): boolean {
        return this._locked;
    }
    public set locked(value: boolean) {
        this._locked = value;

        // When you lock/unlock a word, apply the same to all of its letters
        for(let i = 0; i < this._length; i++) {
            this._letters[i].locked = value;
        }
    }
    public get pairWord(): boolean {
        return this._pairWord;
    }
    public set pairWord(value: boolean) {
        this._pairWord = value;
    }
    public get status(): WordStatus {
        return this._status;
    }
    public set status(value: WordStatus) {
        this._status = value;
    }
    public get populated(): boolean {
        return this._populated;
    }
}

// A single letter
export class Letter {
    // Actual text (1 character) of the letter
    // Set to null if the letter is blank/not populated
    private _character: string;

    // Can the letter be changed
    private _locked: boolean;

    // Was this letter entered by the user
    // False if it's an overlayed system-supplied letter from a solution
    private _userEntered: boolean;

    private _characterChangeCallback: () => void;

    constructor(userEntered: boolean, characterChangeCallback: () => void) {
        this._userEntered = userEntered;
        this._characterChangeCallback = characterChangeCallback;
    }

    public get character(): string {
        return this._character;
    }
    public set character(value: string) {
        if (!this._locked) {
            this._character = value;

            // Tell the parent word (via callback) thet our letter changed
            this._characterChangeCallback();
        }
    }
    public get locked(): boolean {
        return this._locked;
    }
    public set locked(value: boolean) {
        this._locked = value;
    }
    public get userEntered(): boolean {
        return this._userEntered;
    }
    public set userEntered(value: boolean) {
        this._userEntered = value;
    }
}

// A solution is just a set of words that makes up a solved puzzle
// There is not much checking done here so make sure the solutions
// tied to a board have the same number of letters & number of hops.
export class Solution {
    private _words: SolutionWord[];

    constructor(wordArray: string[]) {
        this._words = [];
        for(let i = 0; i < wordArray.length; i++) {
            let solutionWord: SolutionWord = new SolutionWord(wordArray[i].length);
            solutionWord.setText(wordArray[i]);
            this._words.push(solutionWord);
        }

        // Preconfigure pair words
        this._words[0].locked = true;
        this._words[0].pairWord = true;
        this._words[wordArray.length - 1].locked = true;
        this._words[wordArray.length - 1].pairWord = true;
    }

    stringify(): string {
        return Helper.stringify(this._words);
    }

    // Overlay this solution on the top of the provided puzzle.
    // This keeps all the filled in portions of the puzzle and
    // then fills in the blanks with this solution's words.
    // Using this, you can tell which words were user entered
    // and which are from the solution.
    // Copy by value, not reference so nothing gets screwed up.
    public overlayOnPuzzle(puzzleWords: Word[]) : Word[] {
        const overlay: Word[] = [];

        // Loop through all the words
        for (let i = 0; i < puzzleWords.length; i++) {
            let puzzleWord = puzzleWords[i];
            let solutionWord = this._words[i];

            // Create a new word
            let overlayWord: Word = new Word(puzzleWord.length);

            // Loop through all puzzle letters
            for (let j = 0; j < puzzleWord.letters.length; j++) {
                let puzzleLetter = puzzleWord.letters[j];
                let solutionLetter = solutionWord.letters[j];

                let overlayLetter: Letter;

                if (puzzleLetter.character != null) {
                    // User letter was provided
                    overlayLetter = new Letter(puzzleLetter.userEntered, ()=>{});
                    overlayLetter.character = puzzleLetter.character;
                    overlayLetter.locked = puzzleLetter.locked;
                } else {
                    // User letter was not provide, use the solution
                    overlayLetter = new Letter(solutionLetter.userEntered, ()=>{});
                    overlayLetter.character = solutionLetter.character;
                    overlayLetter.locked = solutionLetter.locked;
                }
                overlayWord.letters[j] = overlayLetter;
            }

            overlayWord.status = puzzleWord.status;
            overlayWord.pairWord = puzzleWord.pairWord;
            overlay.push(overlayWord);
        }
        
        return overlay;
    }
}

export class SolutionWord extends Word {
    constructor(length: number) {
        super(length);

        // A solution word will always be populated
        this._populated = true;
    }

    protected populateLetters() {
        for(let i = 0; i < this._length; i++) {
            // Create the letters as non-user-populated and without a callback
            this._letters.push(new Letter(false, ()=>{}));
        }
    }
}

export class Helper {
    static stringify(words: Word[]): string {
        let str: string = "{ ";
        for (let i = 0; i < words.length; i++) {
            str += words[i].stringify();
            if (i < words.length-1) {
                str += ", ";
            } 
        }
        str += " }";
        return str;
    }
}
