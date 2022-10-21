import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class AccountComponent implements OnInit {
  constructor(
    public activeModal: NgbActiveModal,
    private formBuilder: FormBuilder
  ) { }

  ngOnInit() { }

  // Form fields
  email: FormControl = new FormControl('', [Validators.email, Validators.required ]);
  password: FormControl = new FormControl('', [Validators.required, Validators.min(3) ]);

  // The form on the page
  signin: FormGroup = new FormGroup({
    email: this.email,
    password: this.password
  });
  // Toggle for hiding the password
  hidePassword = true;

  onSubmit(): void {
    // Process checkout data here
    console.log('Profile submission: ', this.signin.value);
  }
}
