import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit {

  errorMessage:string = '';
  form!: FormGroup;
  constructor(public authService: AuthService, private fb: FormBuilder, public dialogRef: MatDialogRef<ForgotPasswordComponent>) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      email: [null,[Validators.required,Validators.email]],
    });
  }

  passwordRecovery(){
    this.errorMessage = '';
    this.authService.ForgotPassword(this.form.value.email)
    .then((response) => {
      if(response.status == false){
        //console.log(response.message.code);
        this.errorMessage = response.message.code;
        /*if(response.message.code == "auth/user-not-found"){
          this.errorMessage = "User not Found";
        }else if(response.message.code == "auth/wrong-password"){
          this.errorMessage = "Wrong Password";
        }else {
          //console.log(response.message.code);
          this.errorMessage = response.message.code;
        }*/
      }else{
        //put sucess login here
        this.dialogRef.close(true);
      }
    });
  }

  cancel(){
    this.dialogRef.close(false);
  }
}
