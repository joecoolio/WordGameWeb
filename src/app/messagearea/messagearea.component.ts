import { Component } from '@angular/core';
import { DictionaryWord } from '../services/dictionary.service';
import { EventBusService } from '../services/eventbus.service';
import { GameService } from '../services/game.service';
import { Subscription } from 'rxjs';
import { PlayerService } from '../services/player.service';

@Component({
  selector: 'app-messagearea',
  templateUrl: './messagearea.component.html',
  styleUrls: ['./messagearea.component.css'],
})
export class MessageareaComponent {
  panelOpenState = false;

  private _newgameSubscription: Subscription;
  private _definitionSubscription: Subscription;
  private _dictionaryWords: Map<string, DictionaryWord>; // As definitions arrive, they're stored here
  words: DictionaryWord[]; // Words in the puzzle that have definitions (in order)

  constructor(
    public gameService: GameService,
    private _eventBusService: EventBusService,
    public playerService: PlayerService
  ) {
    // Watch for newGame events to reset the list of words
    this._newgameSubscription = this._eventBusService.onCommand('newGame', () => {
      console.log("MessageArea: newGame requested")
      // Reset the definitions to blank
      this._dictionaryWords = new Map<string, DictionaryWord>();

      // Reset the puzzle words with definitions
      this.words = [];
    });

    // Watch for word definitions to come by
    this._definitionSubscription = this._eventBusService.onCommand('handleDefinition', (definition: DictionaryWord) => {
      console.log("MessageArea: definition received for", definition.word);
      this._dictionaryWords.set(definition.word, definition);

      // Rebuild the list of words and definitions
      this.words = [];

      // Loop through each puzzle word.  If it has a definition, add it.
      this.gameService.board.words.forEach((word) => {
        if (word.populated) { // Partial words don't qualify
          if (this._dictionaryWords.has(word.stringify())) {
            this.words.push(this._dictionaryWords.get(word.stringify()));
          }
        }
      })
    });
  }

  ngOnDestroy() {
    this._newgameSubscription?.unsubscribe();
    this._definitionSubscription?.unsubscribe();
  }

}
