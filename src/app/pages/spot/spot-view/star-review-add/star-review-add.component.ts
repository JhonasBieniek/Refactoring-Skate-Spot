import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SigninComponent } from 'src/app/core/components/signin/signin.component';
import { AuthService } from 'src/app/shared/services/auth.service';
import { SpotService } from '../../shared/services/spot.service';
import { ConfirmationDialogComponent } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-star-review-add',
  templateUrl: './star-review-add.component.html',
  styleUrls: ['./star-review-add.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class StarReviewAddComponent implements OnInit {

  ratingValue: number = 0;
  form!: FormGroup;
  user: any;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private fb: FormBuilder, public authService: AuthService, private dialog: MatDialog, private spotService: SpotService, public dialogRef: MatDialogRef<StarReviewAddComponent>) {
    this.user = authService.getUser();
    //.log(data.stars);
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      review: [''],
      ratingValue: [0, Validators.required]
    });
  }

  save(){
      if(this.user != null){
        //this.spotService.setStar(this.user.uid, this.data.spotId, this.form.controls['ratingValue'].value, this.form.controls['review'].value)
        this.dialogRef.close();
      }else{
  
        let dialogConfig = new MatDialogConfig();
          dialogConfig = {
            maxWidth: '600px',
          }
          dialogConfig.data = [];
          dialogConfig.data.message = "To rate this spot you must be logged in, do you want to log in?";
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
                //this.spotService.setStar(this.user.uid, this.data.spotId, this.form.controls['review'].value)
                this.dialogRef.close();
              }
            });
          }
        });
      }
  }

  starHandler(value:number) {
    this.form.controls['ratingValue'].setValue(value);
  }

}
