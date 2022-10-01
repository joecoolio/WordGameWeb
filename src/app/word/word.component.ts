import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'word',
  templateUrl: './word.component.html',
  styleUrls: ['./word.component.css'],
})
export class WordComponent implements OnInit {
  @Input() wordArray;
  selectedLetter = 0;

  constructor() {}

  ngOnInit() {}

  public setSeletedLetter(_index: number) {
    this.selectedLetter = _index;
  }
}
