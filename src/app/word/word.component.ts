import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'word',
  templateUrl: './word.component.html',
  styleUrls: ['./word.component.css'],
})
export class WordComponent implements OnInit {
  @Input() wordArray;

  constructor() {}

  ngOnInit() {}
}
