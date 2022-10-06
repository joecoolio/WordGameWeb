import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit {
  @Output() parentOpenSettings = new EventEmitter();

  public isCollapsed = false;

  constructor() {}

  ngOnInit() {}

  openSettings() {
    this.parentOpenSettings.emit();
  }
}
