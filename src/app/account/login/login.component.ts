import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { PlayerService } from 'src/app/services/player.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  constructor(
    public activeModal: NgbActiveModal,
    private formBuilder: FormBuilder,
    private playerService: PlayerService,
  ) {
    this.errorMessage = "";
  }

  ngOnInit() {
    this.showLoginForm = true;
    this.loading = false;
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

  // Error message if anything goes wrong
  errorMessage: string;

  // Flag to indicate that an API call is running
  loading: boolean;

  onSubmitLogin(): void {
    // Process login
    console.log('Login: ', this.loginFormGroup.value);
  
    this.loading = true;
    this.playerService.login(
      this.email.value,
      this.password.value,
      // Success callback
      ()=> {
        console.log("Login success callback");
        
        // Get user settings
        this.playerService.getSettings(
          ()=> {
            console.log("Get settings success callback");
          },
          (error: string)=> {
            console.log("Get settings failure callback", error);
            this.loading = false;
          }
        );
          
        this.loading = false;

        // Close the window
        this.activeModal.close('Login success')

      },
      (error: string)=> {
        this.errorMessage = "Login failed, try again?"
        console.log("Login failure callback", error);
        this.loading = false;
      }
    );
  }

  onSubmitRegister(): void {
    this.__doRegister(this.name.value, this.email.value, this.password.value, false);
  }

  loginAsGuest(): void {
    // Create a random username and password
    this.__doRegister('Guest', "Guest-" + crypto.randomUUID() + "@guestuser.com", crypto.randomUUID(), true);
  }

  private __doRegister(name: string, email: string, password: string, applyExpiry: boolean): void {
    this.playerService.name = name;
  
    this.loading = true;
    this.playerService.register(
      email,
      password,
      applyExpiry,
      // Success callback
      ()=> {
        console.log("Register success callback");
        
        // Get user settings
        this.playerService.getSettings(
          ()=> {
            console.log("Get settings success callback");
          },
          (error: string)=> {
            console.log("Get settings failure callback", error);
            this.loading = false;
          }
        );
          
        this.loading = false;

        // Close the window
        this.activeModal.close('Register success')
      },
      (error: string)=> {
        this.errorMessage = "Registration failed, user exists with a different password?"
        console.log("Register failure callback", error);
        this.loading = false;
      }
    );
  }

}
