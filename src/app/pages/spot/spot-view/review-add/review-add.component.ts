import { SpotService } from 'src/app/pages/spot/shared/spot.service';
import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FirebaseError } from 'firebase/app';
import { SigninComponent } from 'src/app/core/components/signin/signin.component';
import { AuthService } from 'src/app/shared/services/auth.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { ConfirmationDialogComponent } from 'src/app/shared/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-review-add',
  templateUrl: './review-add.component.html',
  styleUrls: ['./review-add.component.scss']
})
export class ReviewAddComponent implements OnInit {

  form!: FormGroup;
  user: any;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private fb: FormBuilder, public authService: AuthService, private dialog: MatDialog, private spotService: SpotService, public dialogRef: MatDialogRef<ReviewAddComponent>,
  private notification: NotificationService) {
    this.user = authService.getUser();
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      review: [null, Validators.required],
    });
  }

  save(){
      if(this.user != null){
        this.spotService.createReview(this.user.uid, this.data.spot_uid, this.user.displayName ,this.form.controls['review'].value).then( () => {
          this.notification.notify("Thanks for the review.", 2000);
        }).catch( (error: FirebaseError) => {
          this.notification.notify(error.message, 2000);
        });
        this.dialogRef.close();
      }else{
  
        let dialogConfig = new MatDialogConfig();
          dialogConfig = {
            maxWidth: '600px',
          }
          dialogConfig.data = [];
          dialogConfig.data.message = "To send review about this spot you must be logged in, do you want to log in?";
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
                this.spotService.createReview(this.user.uid, this.data.spot_uid, this.user.displayName ,this.form.controls['review'].value).then( () => {
                  this.notification.notify("Thanks for the review.", 2000);
                }).catch( (error: FirebaseError) => {
                  this.notification.notify(error.message, 2000);
                });
                this.dialogRef.close();
              }
            });
          }
        });
      }
  }

}
