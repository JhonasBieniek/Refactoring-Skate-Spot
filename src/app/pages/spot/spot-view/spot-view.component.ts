import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MatDialog, MatDialogConfig, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Unsubscribe } from 'firebase/auth';
import { onSnapshot } from 'firebase/firestore';
import { timeout } from 'rxjs/operators';
import { SigninComponent } from 'src/app/core/components/signin/signin.component';
import { AuthService } from 'src/app/core/services/auth.service';
import { SharedService } from 'src/app/core/services/shared.service';
import { SkaterService } from 'src/app/pages/skaters/shared/skater.service';
import { SpotService } from 'src/app/pages/spot/shared/spot.service';
import { ConfirmationDialogComponent } from 'src/app/shared/confirmation-dialog/confirmation-dialog.component';
import { Skater } from 'src/app/pages/skaters/shared/skater.model';
import { DialogShareComponent } from '../dialog-share/dialog-share.component';
import { ReportAddComponent } from './report-add/report-add.component';
import { ReviewAddComponent } from './review-add/review-add.component';
import { StarReviewAddComponent } from './star-review-add/star-review-add.component';

//import { fas, faShare, faTimesCircle, faCircle } from '@fortawesome/free-solid-svg-icons';
//import { fab } from '@fortawesome/free-brands-svg-icons'
@Component({
  selector: 'app-spot-view',
  templateUrl: './spot-view.component.html',
  styleUrls: ['./spot-view.component.scss'],
  //encapsulation: ViewEncapsulation.None,
})
export class SpotViewComponent implements OnInit {
  data: any;
  //currentUrl = 'https://www.dugong.com.br/skatesfera/#/spot/view/';
  currentUrl = 'https://skateboardonly.com/#/spot/view/';
  currentTitle = '';
  skaterData: any;
  stars: any[] = [];
  reviews: any[] = [];
  unsubscribe!: Unsubscribe;

  constructor(private router: Router, private dialog: MatDialog, private route: ActivatedRoute, private spotService: SpotService, private _snackBar: MatSnackBar,
    private title: Title, private meta: Meta, private skaterService: SkaterService, public authService: AuthService, private sharedService: SharedService,) { // @Inject(MAT_DIALOG_DATA) public data: any
    //library.addIconPacks(fas, fab);
    //library.addIcons(faShare, faTimesCircle, faCircle);
    this.currentUrl = this.currentUrl + route.snapshot.params['id'];
    if (authService.userLoaded == false) {
      authService.getUser();
    }
  }

  ngOnDestroy() {
    this.sharedService.currentSpotUser_uid = '';
    this.sharedService.currentSpot_uid = '';
  }

  ngOnInit(): void {
    this.spotService.getSpotView(this.route.snapshot.params['id']).then((docSnap) => {
      if (docSnap.exists()) {
        
        this.data = docSnap.data();
        //console.log(this.data);
        //console.log(this.data);
        this.title.setTitle("Spot: " + this.data.name)
        this.currentTitle = "Spot: " + this.data.name;

        this.meta.updateTag({ property: 'og:title', content: this.currentTitle });
        this.meta.updateTag({ property: 'name:description', content: 'testando' });
        this.meta.updateTag({ name: 'twitter:card', content: this.data.pictures[0] });
        this.meta.updateTag({ property: 'og:image', content: this.data.pictures[0] });
        this.meta.updateTag({ property: 'og:url', content: this.currentUrl });

        this.sharedService.currentSpotUser_uid = this.data.user_uid;
        this.sharedService.currentSpot_uid = this.data.uid;
        this.getStars(this.data.uid);
        this.getReviews(this.data.uid);
        this.getUser('constructor');
      } else {
        this._snackBar.open("Spot not Found !", undefined, {
          duration: 4000,
        }
        );
        this.router.navigate(['/'])
      }
    });
  }

  getStars(spot_uid: string){
    this.unsubscribe = onSnapshot(this.spotService.getSpotStars(spot_uid), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        //console.log(change.doc.data());
        if (change.type === "added") {
          this.stars.push(change.doc.data());
        }
        if (change.type === "modified") {
          let doc = change.doc.data();
          let itemIndex = this.stars.findIndex(item => item.userId == doc.userId);
          this.stars[itemIndex] = doc;
        }
      });
    });
  }

  getReviews(spot_uid: string){
    this.unsubscribe = onSnapshot(this.spotService.getSpotReviews(spot_uid), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          this.reviews.push({id: change.doc.id, ...change.doc.data()});
        }
        if (change.type === "modified") {
          let doc = {id: change.doc.id, ...change.doc.data()};
          let itemIndex = this.reviews.findIndex(review => review.id == doc.id);
          this.reviews[itemIndex] = doc;
        }
      });
    });
  }

  report() {
    let dialogConfig = new MatDialogConfig();
    dialogConfig = {
      maxWidth: '600px',
      //width: '95vw',
      panelClass: "report-add"
    }

    //console.log(markerInfo);

    dialogConfig.data = [];
    dialogConfig.data.spotId = this.data.uid;
    dialogConfig.data.spot_name = this.data.name;
    dialogConfig.data.spot_country = this.data.address.country;
    let dialogRef = this.dialog.open(
      ReportAddComponent,
      dialogConfig
    );
  }

  getUser(request: any) {
    if(this.authService.user){
      this.skaterService.getSkaterView(this.authService.user?.uid).then(data => {
        if (data.exists()) {
          this.skaterData = data.data();
          if(request == "login") {
            let index = this.skaterData?.favorites_spots?.findIndex((x: any) => x === this.data.uid);
            if(index === -1){
              this.favorite();
            }
          }
        }
      });
    }
  }

  checkFavorite() {
    if (this.skaterData) {
      const index = this.skaterData?.favorites_spots?.findIndex((x: any) => x === this.data.uid);
      return index >= 0 ? true : false
    } else {
      return false;
    }
  }

  favorite() {
    if (this.authService.user?.uid) {
      this.skaterService.addFavorite(this.authService.user?.uid, this.data.uid).then(() => {
        this.getUser('constructor');
      });
    } else {
      this.requestLogin();
    }
  }

  remove() {
    if (this.authService.user?.uid) {
      this.skaterService.removeFavorite(this.authService.user?.uid, this.data.uid).then(() => {
        this.getUser('constructor');
      });
    }
  }

  requestLogin() {
    let dialogConfig = new MatDialogConfig();
    dialogConfig = {
      maxWidth: '600px',
    }
    dialogConfig.data = [];
    dialogConfig.data.message = "To favorite this spot you must be logged in, do you want to log in?";
    dialogConfig.data.confirm = "Log In";
    dialogConfig.data.cancel = "Cancel";
    let dialogRef = this.dialog.open(ConfirmationDialogComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
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
          //console.log(result);
          this.getUser('login');
        });
      }
    });
  }

  imageResize(index: number){
    let gallery = (<HTMLDivElement>document.getElementById("gallery-item-"+index));
    gallery.classList.toggle("full");
  }

  //* old add review
  // addReview(){
  //   let dialogConfig = new MatDialogConfig();
  //   dialogConfig = {
  //     maxWidth: '600px',
  //     //width: '95vw',
  //     panelClass: "review-add"
  //   }

  //   //console.log(markerInfo);

  //   dialogConfig.data = [];
  //   dialogConfig.data.spotId = this.data.uid;
  //   dialogConfig.data.stars = this.stars
  //   let dialogRef = this.dialog.open(
  //     StarReviewAddComponent,
  //     dialogConfig
  //   );

  //   dialogRef.afterClosed().subscribe(value => {
  //   });
  // }

  addReview(){
    let dialogConfig = new MatDialogConfig();
    dialogConfig = {
      maxWidth: '600px',
      //width: '95vw',
      panelClass: "review-add"
    }

    //console.log(markerInfo);

    dialogConfig.data = [];
    dialogConfig.data.spot_uid = this.data.uid;
    let dialogRef = this.dialog.open(
      ReviewAddComponent,
      dialogConfig
    );

    dialogRef.afterClosed().subscribe(value => {
    });
  }
}
