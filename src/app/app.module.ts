import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { HelloComponent } from './hello.component';
import { CellComponent } from './cell/cell.component';
import { WordComponent } from './word/word.component';
import { GameComponent } from './game/game.component';

//Tutorial
import { ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { GameService } from './game.service';
import { SplitPipe } from './split.pipe';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,

    //Tutorial
    ReactiveFormsModule,
    NgbModule,
  ],

  declarations: [
    AppComponent,
    HelloComponent,
    CellComponent,
    WordComponent,
    GameComponent,
    SplitPipe,
  ],
  bootstrap: [AppComponent],
  providers: [GameService],
})
export class AppModule {}
