import { Component, Inject, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import {MatBottomSheetRef} from '@angular/material/bottom-sheet';
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SignEmailComponent } from './sign-email/sign-email.component';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { SignupEmailComponent } from './signup-email/signup-email.component';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.scss']
})
export class SigninComponent implements OnInit{
  
  errorMessage: string = '';
  form!: FormGroup;
  constructor(public authService: AuthService, private dialog: MatDialog, public dialogRef: MatDialogRef<SigninComponent>,  private fb: FormBuilder, @Inject(MAT_DIALOG_DATA) public data: any,
  private router: Router, private _snackBar: MatSnackBar) {
  } 

  ngOnInit(): void {
    this.form = this.fb.group({
      email: [null,[Validators.required,Validators.email]],
      password: [null, Validators.required],
    });
  }

  signIn(){
    this.errorMessage = '';
    this.authService.SignIn(this.form.value.email, this.form.value.password)
    .then((response) => {
      if(response.status == false){
        if(response.message.code == "auth/user-not-found"){
          this.errorMessage = "User not Found";
        }else if(response.message.code == "auth/wrong-password"){
          this.errorMessage = "Wrong Password";
        }else {
          //console.log(response.message.code);
          this.errorMessage = response.message.code;
        }
      }else{
        if(this.data?.returnUrl != null) this.router.navigate([this.data?.returnUrl]);
        this.dialogRef.close();
      }
    });
  }

  forgotPassword(){
    let dialogConfig = new MatDialogConfig();
    dialogConfig = {
      maxWidth: '100vw',
      maxHeight: '100vh',
      width: '450px',
    }
    let dialogRef = this.dialog.open(
      ForgotPasswordComponent,
      dialogConfig,
    );

    dialogRef.afterClosed().subscribe(value => {
      if(value){
        this.errorMessage = "Password reset email sent, check your inbox."
      }
    });
  }

  register(){
    let dialogConfig = new MatDialogConfig();
    dialogConfig = {
      maxWidth: '100vw',
      maxHeight: '100vh',
      width: '450px',
    }
    let dialogRef = this.dialog.open(
      SignupEmailComponent,
      dialogConfig,
    );
    
    dialogRef.afterClosed().subscribe(value => {
      if(value){
        this.dialogRef.close();
      }
    });
  }

  socialLogin(auth: string){
    if(auth == "google"){
      this.authService.GoogleAuth().then( (response: any) =>{
        if(response.status == true){
          if(this.data?.returnUrl != null) this.router.navigate([this.data?.returnUrl]);
          this.dialogRef.close();
        }else{
          if(response.error.code == "auth/popup-closed-by-user"){
            this._snackBar.open("Auth closed!", undefined, {
              duration: 4000,
              }
            );
          }else{
            this._snackBar.open(response.error.code, undefined, {
              duration: 4000,
              }
            );
          }
          //this.dialogRef.close();
        }
      });
    }else if(auth == "facebook"){
      this.authService.FacebookAuth().then( (response: any) =>{
        if(response.status == true){
          if(this.data?.returnUrl != null) this.router.navigate([this.data?.returnUrl]);
          this.dialogRef.close();
        }else{
          if(response.error.code == "auth/popup-closed-by-user"){
            this._snackBar.open("Auth closed!", undefined, {
              duration: 4000,
              }
            );
          }else{
            this._snackBar.open(response.error.code, undefined, {
              duration: 4000,
              }
            );
          }
          //this.dialogRef.close();
        }
      });
    }
  }
  

  // openLink(auth: string): void {
  //   if(auth == "google"){
  //     this.authService.GoogleAuth();
  //   }else if(auth == "facebook"){
  //     this.authService.FacebookAuth();
  //   }else if(auth == "email"){
  //       let dialogConfig = new MatDialogConfig();
  //       dialogConfig = {
  //         maxWidth: '95vw',
  //         maxHeight: '100vh',
  //         width: '300px',
  //       }
  //       let dialogRef = this.dialog.open(
  //         SignEmailComponent,
  //         dialogConfig,
  //       );
  //   }
  // }

}
