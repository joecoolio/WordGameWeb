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
    this.playSound('../assets/sounds/9744__horn__typewriter.mp3');
  }

  wordWrong(): void {
    this.playSound('../assets/sounds/650842__andreas__wrong-answer-buzzer.mp3');
  }

  wordCorrect(): void {
    this.playSound('../assets/sounds/345299__scrampunk__okay.mp3');
  }

  puzzleSolved(): void {
    this.playSound('../assets/sounds/393402__stevedrums__group-yay-cheer.mp3');
  }

  hintGiven(): void {
    this.playSound('../assets/sounds/243749__unfa__metronome-1khz-weak-pulse.mp3');
  }

  hintUnavailable(): void {
    this.playSound('../assets/sounds/554053__gronkjaer__wronganswer.mp3');
  }
}
