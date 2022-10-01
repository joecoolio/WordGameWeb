import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { CellComponent } from './cell/cell.component';
import { WordComponent } from './word/word.component';
import { GameComponent } from './game/game.component';

//Tutorial
import { ReactiveFormsModule } from '@angular/forms';
import { GameService } from './game.service';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,

    //Tutorial
    ReactiveFormsModule,
  ],

  declarations: [AppComponent, CellComponent, WordComponent, GameComponent],
  bootstrap: [AppComponent],
  providers: [GameService],
})
export class AppModule {}
