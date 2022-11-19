import { Component, OnInit } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { faPause } from '@fortawesome/free-solid-svg-icons';

const IMGURL_ROOT = "../../assets/images/";

@Component({
    selector: 'app-pause',
    templateUrl: './pause.component.html',
    styleUrls: ['./pause.component.css'],
  })
  export class PauseComponent implements OnInit {
    faPause = faPause;

    constructor(
        public activeModal: NgbActiveModal,
    ) {

    }

    ngOnInit(): void {
    }
  }  