import { sendData } from './../../shared/services/sendData.service';
import { SpotService } from '../../shared/services/spot.service'
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SigninComponent } from 'src/app/core/components/signin/signin.component';
import { AuthService } from 'src/app/shared/services/auth.service';
import { ConfirmationDialogComponent } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-report-add',
  templateUrl: './report-add.component.html',
  styleUrls: ['./report-add.component.scss']
})
export class ReportAddComponent implements OnInit {

  ratingValue: number = 0;
  form!: FormGroup;
  user: any;
  disabled:boolean = false;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private fb: FormBuilder, public authService: AuthService, private dialog: MatDialog,
    public dialogRef: MatDialogRef<ReportAddComponent>, private _snackBar: MatSnackBar,private sendData: sendData, private spotService: SpotService) {
    this.user = authService.getUser();
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      reason: [null, Validators.required]
    });
  }

  save(){
    if(this.form.valid){
      if(this.user != null){
        this.disabled = true;
        this.sendData.addReport( this.form.controls['reason'].value, this.data.spotId, this.user.uid, 'reported', this.data.spot_country, this.data.spot_name, this.user.displayName)
        .then( response => {
          this.disabled = false;
          this._snackBar.open("Reported Spot", undefined, {
            duration: 4000,
            }
          );
          this.dialogRef.close(true);
        });
        //this.dialogRef.close();
      }else{
  
        let dialogConfig = new MatDialogConfig();
          dialogConfig = {
            maxWidth: '600px',
          }
          dialogConfig.data = [];
          dialogConfig.data.message = "To report this spot you must be logged in, do you want to log in?";
          dialogConfig.data.confirm = "Log In";
          dialogConfig.data.cancel = "Cancel";
        let dialogRef = this.dialog.open(ConfirmationDialogComponent, dialogConfig);
    
        dialogRef.afterClosed().subscribe(result => {
          if(result){
            let dialogConfig = new MatDialogConfig();
            dialogConfig = {
              maxWidth: '100vw',
              maxHeight: '100vh',
              width: '450px',
            }
            let dialogRef = this.dialog.open(
              SigninComponent,
              dialogConfig,
            );
  
            dialogRef.afterClosed().subscribe(result => {
              this.user = this.authService.getUser();
              if(this.user != null){
                this.disabled = true;
                this.sendData.addReport( this.form.controls['reason'].value, this.data.spotId, this.user.uid, 'reported', this.data.spot_country, this.data.spot_name, this.user.displayName)
                .then( (response: any) => {
                  this.disabled = false;
                  this._snackBar.open("Reported Spot", undefined, {
                    duration: 4000,
                    }
                  );
                  this.dialogRef.close(true);
                });
              }
            });
          }
        });
      }
    }else{
      this.form.markAllAsTouched();
    }
  }


}
