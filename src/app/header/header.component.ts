import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { EventBusService } from '../services/eventbus.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit {
  @Output() parentOpenLogin = new EventEmitter();
  @Output() parentOpenProfile = new EventEmitter();
  @Output() parentOpenSettings = new EventEmitter();

  public isCollapsed = true;

  constructor(
    private eventbusService: EventBusService
  ) {}

  ngOnInit() {}

  logout() {
    console.log("Header: logout requested");
    this.eventbusService.emitNotification('logout', null);
  }

  openLogin() {
    this.parentOpenLogin.emit();
  }

  openSettings() {
    this.parentOpenSettings.emit();
  }

  openProfile() {
    this.parentOpenProfile.emit();
  }

}
