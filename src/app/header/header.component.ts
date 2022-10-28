import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { EventBusService } from '../services/eventbus.service';
import { TokenService } from '../services/token.service';
import { ConfirmationComponent } from '../confirmation/confirmation.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

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
    private eventbusService: EventBusService,
    private tokenService: TokenService,
    private modalService: NgbModal
  ) {}

  ngOnInit() {}

  logout() {
    // A game is already running, get a confirmation before you wipe it out
    const modalRef = this.modalService.open(ConfirmationComponent);
    modalRef.componentInstance.headerText = "Log out?";
    modalRef.componentInstance.messageText = "Are you sure you want to log out?";
    modalRef.result.then(
      (result: string) => {
        if (result == "yes") {
          console.log("Header: logout requested");
          this.eventbusService.emitNotification('logout', null);
        }
      },
      (err) => { /* ignore */ }
    );

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

  public get loggedIn(): boolean {
    return this.tokenService.isLoggedIn;
  }

}
