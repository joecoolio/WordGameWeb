import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AudioService {

  constructor() { }

  letterEntered(): void {
    const audio = new Audio();
    audio.src = '../assets/sounds/click.mp3';
    audio.load();
    audio.play();
  }
}
