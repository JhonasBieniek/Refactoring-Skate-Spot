import { receiveData } from './../../shared/services/receiveData.service';
import { sendData } from './../../shared/services/sendData.service';
import { SpotService } from '../../shared/services/spot.service';
import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Star } from '../../shared/models/star.model';

import { onSnapshot} from '@firebase/firestore';
import { Unsubscribe } from '@firebase/util';
import { AuthService } from 'src/app/shared/services/auth.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.component';
import { SigninComponent } from 'src/app/core/components/signin/signin.component';
import { StarReviewAddComponent } from '../star-review-add/star-review-add.component';


@Component({
  selector: 'app-star-review',
  templateUrl: './star-review.component.html',
  styleUrls: ['./star-review.component.scss']
})
export class StarReviewComponent implements OnInit {

  @Input() spotId: any;

  stars: any[] = [];
  unsubscribe!: Unsubscribe; 
  avgRating: number = 0;
  //user: any;

  constructor(private spotService: SpotService, public authService: AuthService, private dialog: MatDialog, private sendData: sendData, private receiveData: receiveData) {
    //this.user = authService.getUser();
  }

  ngOnInit() {
    this.unsubscribe = onSnapshot(this.receiveData.getSpotStars(this.spotId), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        // console.log(change.doc.data())
        if (change.type === "added") {
          this.stars.push(change.doc.data());
        }
        if (change.type === "modified") {
          let doc = change.doc.data();
          let itemIndex = this.stars.findIndex(item => item.user_uid == doc.user_uid);
          this.stars[itemIndex] = doc;
        }
        
        this.avgRatingCalc();
      });
      
    });
    //this.unsubscribe();
  }

  avgRatingCalc(){
    //console.log(this.stars)
    let ratings = this.stars.map((v:any) =>{
      return v.value
    } );
    //console.log(ratings)
    this.avgRating = ratings.length != 0 ? ratings.reduce((total:any, val:any) => total + val) / ratings.length : 0 * 100; //'not reviewed'

    //console.log(this.avgRating)
  }

  //* old review, quando era possivel colocar comentario.
  // review(){
  //   let dialogConfig = new MatDialogConfig();
  //   dialogConfig = {
  //     maxWidth: '600px',
  //     //width: '95vw',
  //     panelClass: "review-add"
  //   }

  //   //console.log(markerInfo);

  //   dialogConfig.data = [];
  //   dialogConfig.data.spotId = this.spotId;
  //   dialogConfig.data.stars = this.stars
  //   let dialogRef = this.dialog.open(
  //     StarReviewAddComponent,
  //     dialogConfig
  //   );

  //   dialogRef.afterClosed().subscribe(value => {
  //   });
  // }

  getMyRating(){
    if(this.authService?.user != null ){
      let myStar = 0;
      this.stars.map((star)=> {
        if(star.user_uid === this.authService.user?.uid) myStar = star.value;
      });
      return myStar;
    }else{
      return 0;
    }
  }

  starHandler(value:number) {
    if(this.authService?.user != null){
      if(this.getMyRating() == 0){
        this.sendData.setStar(this.authService?.user.uid, this.spotId, value);
      }else{
        this.sendData.updateStar(this.authService?.user.uid, this.spotId, value);
      }
      //this.spotService.setStar(this.authService?.user.uid, this.spotId, value, this.getMyRating() > 0 ? true : false);
      //this.myRatingValue = value;
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
            //this.user = this.authService.getUser();
            if(this.authService?.user.uid != null){
              if(this.getMyRating() == 0){
                this.sendData.setStar(this.authService?.user.uid, this.spotId, value);
              }else{
                this.sendData.updateStar(this.authService?.user.uid, this.spotId, value);
              }
              //this.myRatingValue = value
            }
          });
        }
      });
    }
  }



}
