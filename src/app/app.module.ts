import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';

// Neccessary for the app
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

// App components
import { AppComponent } from './app.component';
import { GameComponent } from './game/game.component';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { SettingsComponent } from './settings/settings.component';
import { LoginComponent } from './account/login/login.component';
import { LeaderboardComponent } from './account/leaderboard/leaderboard.component';

// Material
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSliderModule } from '@angular/material/slider';
// import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRadioModule } from '@angular/material/radio';

// import { FontAwesomeModule, FaIconLibrary } from '@fontawesome/angular-fontawesome';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AuthInterceptor } from './services/auth.interceptor';
import { TimingInterceptor } from './services/timing.interceptor';
import { StatsComponent } from './account/stats/stats.component';

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
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatCardModule,
    MatTooltipModule,
    MatRadioModule,
    // NgbModule,
  ],

  declarations: [
    AppComponent,
    GameComponent,
    HeaderComponent,
    FooterComponent,
    SettingsComponent,
    LoginComponent,
    LeaderboardComponent,
    StatsComponent
  ],
  bootstrap: [AppComponent],
  providers: [
    { // Handles token authentication on outgoing requests.  Also handles expired access tokens.
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    { // Grabs the ExecutionTime header off of responses.
      provide: HTTP_INTERCEPTORS,
      useClass: TimingInterceptor,
      multi: true,
    }
  ],
  entryComponents: [],
})
export class AppModule {}
