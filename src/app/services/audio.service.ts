import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AudioService {

  constructor() { }

  private playSound(filename: string) {
    const audio = new Audio();
    audio.src = filename;
    audio.load();
    audio.play();
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
