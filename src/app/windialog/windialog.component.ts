import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-windialog',
  templateUrl: './windialog.component.html',
  styleUrls: ['./windialog.component.css'],
})
export class WinDialogComponent implements OnInit {
  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit() {}

}
