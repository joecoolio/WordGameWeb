import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { PlayerService } from 'src/app/services/player.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class RegisterComponent implements OnInit {
  constructor(
    public activeModal: NgbActiveModal,
    private formBuilder: FormBuilder,
    private playerService: PlayerService
  ) { }

  ngOnInit() {
    this.showLoginForm = true;
  }

  // Form fields
  name: FormControl = new FormControl('', [Validators.required ]);
  email: FormControl = new FormControl('', [Validators.email, Validators.required ]);
  password: FormControl = new FormControl('', [Validators.required ]);

  // Toggle for login/register
  // True = login, false = register
  showLoginForm: boolean;

  // The login form
  loginFormGroup: FormGroup = new FormGroup({
    email: this.email,
    password: this.password
  });
  // Toggle for hiding the password
  hidePassword = true;

  // The register form
  registerFormGroup: FormGroup = new FormGroup({
    name: this.name,
    email: this.email,
    password: this.password
  });


  onSubmitLogin(): void {
    // Process login
    console.log('Login: ', this.loginFormGroup.value);
    this.playerService.email = this.email.value;
    this.playerService.password = this.password.value;
  
    this.playerService.login();
  }

  onSubmitRegister(): void {
    this.playerService.email = this.email.value;
    this.playerService.password = this.password.value;
    this.playerService.name = this.name.value;
  
    console.log('Register: ', this.registerFormGroup.value);
    this.playerService.register();
  }
}
