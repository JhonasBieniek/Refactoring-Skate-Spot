import { AfterViewChecked, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/shared/services/auth.service';
import { SkaterService } from 'src/app/pages/skaters/shared/skater.service';
import { SpotService } from 'src/app/pages/spot/shared/services/spot.service';
import { Skater } from 'src/app/pages/skaters/shared/skater.model';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { SharedService } from 'src/app/shared/services/shared.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-skater',
  templateUrl: './skater.component.html',
  styleUrls: ['./skater.component.scss']
})
export class SkaterComponent implements OnInit {

  token:string = "IGQVJVT3Y3dkRiNGJSZATVHcnRFWURPRU1MSW5ldzh2VTZAqM0RpNF9PaGhSM2xOVlU3cGFQeFJ5cUppOF9XUTR3R0U4RTlteGZAaNDl5TlpUMzkyc2N6LU41al9YUXoxUGVsWENrXzFaemtaS2FRTUlyYQZDZD";
  tokenDiogenes:string = "IGQVJYQlVwOEZAWSEFIcVgwelRHY3ZAKTlVhYUk4Rk9BVW43MUlVX2tXelBUSm15MUZA5VnpHbnllb05yTTVGV1lldE14dkU0VVF3WWhIME04cFhfZAVhRMFNkcThwWXRpVUtCbkZAPWllB";
  url: string = "https://graph.instagram.com/me/media?access_token="+this.tokenDiogenes+"&fields=media_url,media_type,caption,permalink";
  // tokenUrl:string = "https://api.instagram.com/oauth/access_token";

  id= "4472715212850425";
  instagramData: any[] = [];
  //* chipListPatrocinios e marcas
  

  selectable = true;
  removable = true;
  addOnBlur = true;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  //* patrocinio
  //patrocinios: string[] = ['tio do leite', 'barraca do ze'];
  //* marcas
  //marcas: string[] = ['Nike', 'Adidas', "Coca-Cola"];

  //* chiplistPatrocinios End
  
  disabled: boolean = false;
  user: any;
  form!: FormGroup;
  //readonly: boolean =  true;
  spots: any[] = [];
  favorites_spots: any[] = [];
  // pros = [
  //   {name: 'Tony Hawk'},
  //   {name: 'Bob Burnquist'},
  //   {name: 'Rodney Mullen'},
  //   {name: 'Danny Way'},
  //   {name: 'Nyjah Huston'},
  //   {name: 'Ryan Sheckler'},
  //   {name: 'Bucky Lasek'},
  //   {name: 'Paul Rodriguez'},
  //   {name: 'Daewon Song'},
  //   {name: 'Eric Koston'},
  // ];

  skater: any;
  clickEventSubscription!: Subscription;

  constructor(
  private fb: FormBuilder,
  public authService: AuthService,
  public skaterService: SkaterService,
  public spotService: SpotService,
  private _snackBar: MatSnackBar,
  private router: Router,
  public sharedService: SharedService) {
    if(authService.userLoaded == false){
      authService.getUser();
    }
  }
  
  ngOnDestroy() {
    if(this.clickEventSubscription) this.clickEventSubscription.unsubscribe();
  }
  
  ngOnInit(): void {
    this.form = this.fb.group({
      name: [null, Validators.required],
      nickname: [null],
      city: [null],
      country: [null],
      bio: [null],
      sponsorships: [[]],
      brands: [[]],
      deck: [null],
      truck: [null],
      wheel: [null],
      bearings: [null],
      pros: [[]]
    });
    
    this.disabled = true;
    setTimeout(() => {
      this.disabled = false;
      if(this.authService.user == null ){
        this.router.navigate(['/'])
      }else{
        this.clickEventSubscription = this.sharedService.getClickEvent().subscribe( ()=> {
          this.save();
        });
        this.user = this.authService.user;
        // if(this.user.uid != null && this.user.uid != undefined && this.user.uid != ''){
        this.loadSkater();
        // }else{
        //   this.router.navigate(['/'])
        // }
      }
      
    }, 1000);
    // this.requestUserId();
    //this.tokenRequest();
  }

  // tokenRequest(){
  //   this.skaterService.getToken(this.tokenUrl, {
  //     client_id: '3115854075403614',
  //     client_secret: 'd886230bb6330aab1e0ba17e9d0a2457',
  //     grant_type: 'authorization_code',
  //     redirect_uri: 'https://socialsizzle.herokuapp.com/auth',
  //     code: this.codigo
  //   }).subscribe( (res)=>{
  //     console.log("resposta: ", res)
  //     // if(res.data.length > 0 ){
  //     //   this.instagramData = res.data;
  //     // }
  //   }, err=>{
  //     console.log("err: ", err)
  //   })
  // }

  requestUserId(){
    this.skaterService.get_instagramID(this.url).subscribe( (res)=>{
      //console.log("resposta: ", res)
      if(res.data.length > 0 ){
        this.instagramData = res.data;
      }
    }, err=>{
      //console.log("err: ", err)
    })
  }

  get pros(): FormArray {
    return this.form.get('pros') as FormArray;
  }

  get sponsorships(): FormArray {
    return this.form.get('sponsorships') as FormArray;
  }

  get brands(): FormArray {
    return this.form.get('brands') as FormArray;
  }

  loadSkater(){
    this.disabled = true;
    this.skater = null;
    this.skaterService.getSkaterView(this.user.uid).then( (docSnap) => {
      if (docSnap.exists()) {
        this.disabled = false;
        this.skater =  docSnap.data();
        this.favorites_spots = [];
        if(this.skater.favorites_spots?.length > 0){
          this.skater.favorites_spots.forEach((spot:any) => {
            this.spotService.getSpotView(spot).then( docSnap =>{
              if (docSnap.exists()) this.favorites_spots.push(docSnap.data())
            })
          });
        }
        this.form.patchValue(this.skater);
      } else {
        this.disabled = false;
        //this.readonly = false;
        this.sharedService.readonly = false;
        this.form.get('name')?.setValue(this.user.displayName);
        // this._snackBar.open("Skater not Found!", undefined, {
        //   duration: 4000,
        //   }
        // );
      }
    });

    this.spotService.getSkaterSpots(this.user.uid).then( (querySnapshot) => {
      let docs: any[] = [];
      querySnapshot.forEach(doc =>{
        docs.push(doc.data());
      })
      this.spots = docs;
    });
  }

  verifyName(): any{
    if(this.form.get('name')?.value.trim().length === 0){
      this._snackBar.open("Please enter a name", undefined, {
        duration: 3000,
      });
      return false;
    } else {
      return true;
    }
  }

  save(){
    if(this.verifyName() && this.form.valid){
      this.disabled = true;

      let skater: Skater = {
        name: this.form.controls['name'].value,
        nickname: this.form.controls['nickname'].value,
        sponsorships: this.form.controls['sponsorships'].value,
        city: this.form.controls['city'].value,
        country: this.form.controls['country'].value,
        bio: this.form.controls['bio'].value,
        brands: this.form.controls['brands'].value,
        deck: this.form.controls['deck'].value,
        truck: this.form.controls['truck'].value,
        wheel: this.form.controls['wheel'].value,
        bearings: this.form.controls['bearings'].value,
        pros: this.form.controls['pros'].value,
        user_uid: this.user.uid
      }

      this.skaterService.updateSkater(skater.user_uid,skater).then(() => {
        this._snackBar.open("Skater registered successfully", undefined, {
          duration: 2000,
          }
        );
        this.disabled = false;
        this.sharedService.readonly = true;
        //this.readonly = true;
        this.loadSkater();
      }).catch((error: any) => {
        this.disabled = false;
        //console.log(error);
        this._snackBar.open("Skater registered error", undefined, {
          duration: 2000,
          }
        );
      });
    } else{
      this.form.markAllAsTouched();
    }
  } 

  addSponsorship(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    // Add our patrocinio
    if (value) {
      this.sponsorships.setValue([...this.sponsorships.value, value.trim()]);
      this.sponsorships.updateValueAndValidity();
    }

    // Clear the input value
    event.chipInput!.clear();
  }

  removeSponsorship(sponsorship: string): void {
    const index = this.sponsorships.value.indexOf(sponsorship);

    if (index >= 0) {
      this.sponsorships.value.splice(index, 1);
      this.sponsorships.updateValueAndValidity();
    }
  }

  addBrand(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    // Add our Marca
    if (value) {
      this.brands.setValue([...this.brands.value, value.trim()]);
      this.brands.updateValueAndValidity();
    }

    // Clear the input value
    event.chipInput!.clear();
  }

  removeBrand(brand: string): void {
    const index = this.brands.value.indexOf(brand);

    if (index >= 0) {
      this.brands.value.splice(index, 1);
      this.brands.updateValueAndValidity();
    }
  }

  addPro(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    // Add our Marca
    if (value) {
      this.pros.setValue([...this.pros.value, value.trim()]);
      this.pros.updateValueAndValidity();
    }

    // Clear the input value
    event.chipInput!.clear();
  }

  removePro(pro: string): void {
    const index = this.pros.value.indexOf(pro);

    if (index >= 0) {
      this.pros.value.splice(index, 1);
      this.pros.updateValueAndValidity();
    }
  }

  editSpot(uid:string){
    //console.log(uid);
    this.router.navigate(['/spot/edit', uid]);
  }
  
}
