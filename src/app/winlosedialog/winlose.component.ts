import { Component, OnInit } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

const IMGURL_ROOT = "../../assets/images/";

@Component({
    selector: 'app-winlose',
    templateUrl: './winlose.component.html',
    styleUrls: ['./winlose.component.css'],
  })
  export class WinLoseComponent implements OnInit {
    private winImages: string[];

    // The image to show - set randomly from the list
    imageUrl: string;

    constructor(
        public activeModal: NgbActiveModal,
    ) {
      this.winImages = [];

      // Pile on all the possible images for winning.  A random one will be picked.
      this.winImages.push("Borat_Thumbs_Up_You_Win.png");
      this.winImages.push("thumbs-up-png-32219.png");
      this.winImages.push("pngfind.com-and-the-winner-is-5184659.png");
      this.winImages.push("Gold-Trophy-Transparent.png");
      this.winImages.push("referee_clipart3433511.png");
      this.winImages.push("koolaid_clipart2479463.png");
    }

    ngOnInit(): void {
      // Pick a random image from the list
      let min: number = 0;
      let max: number = this.winImages.length;
      let imgIndex = Math.floor(Math.random() * (max - min) + min);
      this.imageUrl = IMGURL_ROOT + this.winImages[imgIndex];
    }
  }  