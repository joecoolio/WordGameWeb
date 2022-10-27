import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-login',
  templateUrl: './confirmation.component.html',
  styleUrls: ['./confirmation.component.css']
})
export class ConfirmationComponent implements OnInit {
    @Input() public headerText;
    @Input() public messageText;
    
  constructor(
    public activeModal: NgbActiveModal,
  ) {
  }

  ngOnInit() {
  }

}
