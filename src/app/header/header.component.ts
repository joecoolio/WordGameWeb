import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit {
  @Output() parentOpenSettings = new EventEmitter();

  public isCollapsed = true;

  constructor(private modalService: NgbModal) {}

  ngOnInit() {}

  openSettings() {
    this.parentOpenSettings.emit();
  }
}
