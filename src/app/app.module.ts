import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { GameComponent } from './game/game.component';

import { ReactiveFormsModule } from '@angular/forms';
import { GameService } from './game.service';

// import { FontAwesomeModule, FaIconLibrary } from '@fontawesome/angular-fontawesome';
// import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@NgModule({
  imports: [BrowserModule, FormsModule, ReactiveFormsModule, FontAwesomeModule],

  declarations: [AppComponent, GameComponent],
  bootstrap: [AppComponent],
  providers: [GameService],
})
export class AppModule {}
