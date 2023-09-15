import {
  animate,
  keyframes,
  state,
  style,
  transition,
  trigger
} from "@angular/animations";
import { Component, Input } from '@angular/core';
import { DictionaryWord } from "../services/dictionary.service";
import { Toast, ToastrService, ToastPackage } from "ngx-toastr";


@Component({
  selector: '[definition-toast]',
  templateUrl: './definition-toast.component.html',
  styleUrls: ['./definition-toast.component.css'],
  animations: [
    trigger('flyInOut', [
      state('inactive', style({
        opacity: 0,
      })),
      transition('inactive => active', animate('400ms ease-out', keyframes([
        style({
          transform: 'translate3d(100%, 0, 0) skewX(-30deg)',
          opacity: 0,
        }),
        style({
          transform: 'skewX(20deg)',
          opacity: 1,
        }),
        style({
          transform: 'skewX(-5deg)',
          opacity: 1,
        }),
        style({
          transform: 'none',
          opacity: 1,
        }),
      ]))),
      transition('active => removed', animate('400ms ease-out', keyframes([
        style({
          opacity: 1,
        }),
        style({
          transform: 'translate3d(100%, 0, 0) skewX(30deg)',
          opacity: 0,
        }),
      ]))),
    ]),
  ],
  preserveWhitespaces: false,
})
export class DefinitionToast extends Toast {
  // Word definition being displayed
  dictionaryWord: DictionaryWord;

  @Input() toast: Toast;

  // constructor is only necessary when not using AoT
  constructor(
    protected toastrService: ToastrService,
    public toastPackage: ToastPackage<DictionaryWord>
  ) {
    super(toastrService, toastPackage);
  }

  ngOnInit() {
    this.dictionaryWord = this.toastPackage.config.payload;
  }

  action(event: Event) {
    event.stopPropagation();
    this.toastPackage.triggerAction();
    return false;
  }
}
