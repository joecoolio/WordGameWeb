import { Component, OnInit } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
    selector: 'app-winlose',
    templateUrl: './winlose.component.html',
    styleUrls: ['./winlose.component.css'],
  })
  export class WinLoseComponent implements OnInit {
    constructor(
        public activeModal: NgbActiveModal,
    ) {
    }

    ngOnInit(): void {
    }
  }  