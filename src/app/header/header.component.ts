import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { PlayerService } from '../services/player.service';

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
    private playerService: PlayerService
  ) {}

  ngOnInit() {}

  logout() {
    this.playerService.logout();
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
