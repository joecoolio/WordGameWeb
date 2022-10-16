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
    this.playSound('../assets/sounds/9744__horn__typewriter.wav');
  }

  wordWrong(): void {
    this.playSound('../assets/sounds/650842__andreas__wrong-answer-buzzer.wav');
  }

  wordCorrect(): void {
    this.playSound('../assets/sounds/345299__scrampunk__okay.wav');
  }

  puzzleSolved(): void {
    this.playSound('../assets/sounds/393402__stevedrums__group-yay-cheer.wav');
  }

  hintGiven(): void {
    this.playSound('../assets/sounds/243749__unfa__metronome-1khz-weak-pulse.flac');
  }

  hintUnavailable(): void {
    this.playSound('../assets/sounds/554053__gronkjaer__wronganswer.mp3');
  }
}
