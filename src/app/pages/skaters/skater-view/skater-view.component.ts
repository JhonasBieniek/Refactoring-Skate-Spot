import { Component, OnInit, } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/shared/services/auth.service';
import { SkaterService } from 'src/app/pages/skaters/shared/skater.service';
import { SpotService } from 'src/app/pages/spot/shared/spot.service';
import { Skater } from 'src/app/pages/skaters/shared/skater.model';
import {COMMA, ENTER} from '@angular/cdk/keycodes';

@Component({
  selector: 'app-skater-view',
  templateUrl: './skater-view.component.html',
  styleUrls: ['./skater-view.component.scss']
})
export class SkaterViewComponent implements OnInit {
  
  disabled: boolean = false;
  readonly: boolean =  true;
  spots: any[] = [];
  skater: any;
  favorites_spots: any[] = [];

  constructor(
    public authService: AuthService,
    public skaterService: SkaterService,
    public spotService: SpotService,
    private _snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute) {
      if(authService.userLoaded == false){
        authService.getUser();
      }
    }

  ngOnInit(): void {
    this.loadSkater();
    // if(this.user.uid != null && this.user.uid != undefined && this.user.uid != ''){
    //   this.loadSkater();
    // }else{
    //   this.router.navigate(['/'])
    // }
    
  }

  userVerify(){

  }

  close(){
    this.router.navigate(['/'])
  }

  edit(){
    this.router.navigate(['/skater/'])
  }

  loadSkater(){
    this.disabled = true;
    this.skater = null;
    this.skaterService.getSkaterView(this.route.snapshot.params['id']).then( (docSnap) => {
      if (docSnap.exists()) {
        this.disabled = false;
        this.skater =  docSnap.data();
        if(this.skater.favorites_spots.length > 0){
          this.skater.favorites_spots.forEach((spot:any) => {
            this.spotService.getSpotView(spot).then( docSnap =>{
              if (docSnap.exists()) this.favorites_spots.push(docSnap.data())
            })
          });
        }
      } else {
        this.disabled = false;
        this._snackBar.open("Skater not Found!", undefined, {
          duration: 4000,
          }
        );
        this.router.navigate(['/'])
      }
    });

    this.spotService.getSkaterSpots(this.route.snapshot.params['id']).then( (querySnapshot) => {
      let docs: any[] = [];
      querySnapshot.forEach(doc =>{
        docs.push(doc.data());
      })
      this.spots = docs;
    });
  }

}
