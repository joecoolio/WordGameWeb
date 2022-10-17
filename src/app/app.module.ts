import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';

// Neccessary for the app
import { HttpClientModule } from '@angular/common/http';

// App components
import { AppComponent } from './app.component';
import { GameComponent } from './game/game.component';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { SettingsComponent } from './settings/settings.component';

// Material
import { MatDialogModule } from '@angular/material/dialog';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatInputModule } from '@angular/material/input';
// import { MatButtonModule } from '@angular/material/button';
import { MatSliderModule } from '@angular/material/slider';
// import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';


// import { FontAwesomeModule, FaIconLibrary } from '@fontawesome/angular-fontawesome';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';


// Bootstrap stuff
// import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    MatDialogModule,
    // MatFormFieldModule,
    // MatInputModule,
    // MatButtonModule,
    MatSliderModule,
    MatSlideToggleModule,
    // NgbModule,
  ],

  declarations: [
    AppComponent,
    GameComponent,
    HeaderComponent,
    FooterComponent,
    SettingsComponent,
  ],
  bootstrap: [AppComponent],
  providers: [],
  entryComponents: [],
})
export class AppModule {}
