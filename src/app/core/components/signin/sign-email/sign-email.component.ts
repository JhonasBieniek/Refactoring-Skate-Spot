import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { AuthService } from 'src/app/shared/services/auth.service';
import { ForgotPasswordComponent } from '../forgot-password/forgot-password.component';
import { SignupEmailComponent } from '../signup-email/signup-email.component';

@Component({
  selector: 'app-sign-email',
  templateUrl: './sign-email.component.html',
  styleUrls: ['./sign-email.component.scss']
})
export class SignEmailComponent implements OnInit {

  errorMessage: string = '';
  form!: FormGroup;
  constructor(public authService: AuthService, private dialog: MatDialog, public dialogRef: MatDialogRef<SignEmailComponent>,  private fb: FormBuilder) { }

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
        //put sucess login here
        this.dialogRef.close();
      }
    });
  }

  forgotPassword(){
    let dialogConfig = new MatDialogConfig();
    dialogConfig = {
      maxWidth: '95vw',
      maxHeight: '100vh',
      width: '300px',
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
      maxWidth: '95vw',
      maxHeight: '100vh',
      width: '300px',
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

}
