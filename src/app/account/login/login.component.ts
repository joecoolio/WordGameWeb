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
    private playerService: PlayerService,
  ) { }

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

      },
      (error: string)=> {
        console.log("Login failure callback", error);
        this.loading = false;
      }
    );
  }

  onSubmitRegister(): void {
    this.playerService.name = this.name.value;
  
    this.loading = true;
    this.playerService.register(
      this.email.value,
      this.password.value,
      // Success callback
      ()=> {
        console.log("Register success callback");
        this.loading = false;
      },
      (error: string)=> {
        console.log("Register failure callback", error);
        this.loading = false;
      }
    );
  }
}
