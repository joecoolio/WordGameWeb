import { Injectable } from '@angular/core';
import { PlayerService } from './player.service';

@Injectable({ providedIn: 'root' })
export class AudioService {
  private _audio;

  // All of the audio files - each will be preloaded
  private audioFiles = [
    '../assets/sounds/9744_horn_typewriter.mp3',
    '../assets/sounds/650842_andreas_wrong-answer-buzzer.mp3',
    '../assets/sounds/345299_scrampunk_okay.mp3',
    '../assets/sounds/393402_stevedrums_group-yay-cheer.mp3',
    '../assets/sounds/172950__notr__saddertrombones.mp3',
    '../assets/sounds/243749_unfa_metronome-1khz-weak-pulse.mp3',
    '../assets/sounds/554053_gronkjaer_wronganswer.mp3',
    '../assets/sounds/429720__fellur__tic.mp3'
  ];

  constructor(private playerService: PlayerService) {
    this._audio = new Audio();

    // Preload all the sound files
    for (var i in this.audioFiles) {
      this.preloadAudio(this.audioFiles[i]);
    }
  }

  private playSound(filename: string) {
    if (this.playerService.enableSounds) {
      if (this._audio.src != filename) {
        this._audio.src = filename;
        this._audio.load();
      }
      this._audio.play();
    }
  }

  preloadAudio(url) {
    var audio = new Audio();
    // once this file loads, it will call loadedAudio()
    // the file will be kept by the browser as cache
    audio.addEventListener('canplaythrough', this.loadedAudio, false);
    audio.src = url;
  }
    
  loadedAudio() {
    // this will be called every time an audio file is loaded
    // we keep track of the loaded files vs the requested files
  }


  letterEntered(): void {
    this.playSound('../assets/sounds/9744_horn_typewriter.mp3');
  }

  wordWrong(): void {
    this.playSound('../assets/sounds/650842_andreas_wrong-answer-buzzer.mp3');
  }

  wordCorrect(): void {
    this.playSound('../assets/sounds/345299_scrampunk_okay.mp3');
  }

  puzzleSolved(): void {
    this.playSound('../assets/sounds/393402_stevedrums_group-yay-cheer.mp3');
  }

  puzzleLost(): void {
    this.playSound('../assets/sounds/172950__notr__saddertrombones.mp3');
  }
  hintGiven(): void {
    this.playSound('../assets/sounds/243749_unfa_metronome-1khz-weak-pulse.mp3');
  }

  hintUnavailable(): void {
    this.playSound('../assets/sounds/554053_gronkjaer_wronganswer.mp3');
  }

  clockTick(): void {
    this.playSound('../assets/sounds/429720__fellur__tic.mp3')
  }
}
