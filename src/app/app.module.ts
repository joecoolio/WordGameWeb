import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { GameComponent } from './game/game.component';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';

import { ReactiveFormsModule } from '@angular/forms';
import { GameService } from './game.service';
import { DataService } from './data.service';

import { MatDialogModule } from '@angular/material/dialog';

import { HttpClientModule } from '@angular/common/http';

// import { FontAwesomeModule, FaIconLibrary } from '@fontawesome/angular-fontawesome';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],

  declarations: [AppComponent, GameComponent, HeaderComponent, FooterComponent],
  bootstrap: [AppComponent],
  providers: [GameService, DataService],
  entryComponents: [],
})
export class AppModule {}
