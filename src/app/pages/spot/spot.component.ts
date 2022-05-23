import { HttpClient } from '@angular/common/http';
import { BreakpointObserver } from '@angular/cdk/layout';
import { BaseSpotFormComponent } from 'src/app/shared/components/base-spot-form/base-spot-form.component';
import { NavbarService } from '../../shared/services/navbar.service';
import { Spot, imgFiles } from './shared/models/spot.model';
import { Component, OnInit, ViewEncapsulation, Injector } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { SpotService } from 'src/app/pages/spot/shared/spot.service'; 
import { geohashForLocation } from 'geofire-common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DialogShareComponent } from './dialog-share/dialog-share.component';
import { TypesService } from 'src/app/shared/services/types.service';
import { ConditionsService } from 'src/app/shared/services/conditions.service';
import { QueryDocumentSnapshot, QuerySnapshot } from 'firebase/firestore';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { Subscription } from 'rxjs';
import { SharedService } from 'src/app/core/services/shared.service';
import { DataUrl, DOC_ORIENTATION, NgxImageCompressService, UploadResponse } from 'ngx-image-compress';
import { runInThisContext } from 'vm';

export interface imagePreview {
  name: string;
  file: any;
  orientation: DOC_ORIENTATION,
  cover: boolean
}

@Component({
  selector: 'app-spot',
  templateUrl: './spot.component.html',
  styleUrls: ['./spot.component.scss'],
  //encapsulation: ViewEncapsulation.None
})
export class SpotComponent extends BaseSpotFormComponent implements OnInit {

  spotGeolocation: any;
  disabled: boolean = false;
  historyData: any;
  selectedFiles: any[] = [];
  insertedFiles: number = 0;
  previews: imagePreview[] = [];
  thumbnail: any;
  maxImgs: number = 9;
  dataPictures: any[] = [];
  dataTypes: any[] = [];
  dataConditions: any[] = [];
  user: any;
  watchID!: number;
  clickEventSubscription!: Subscription;

  constructor(
    protected injector: Injector,
    protected route: ActivatedRoute,
    protected router: Router,
    protected fb: FormBuilder,
    protected authService: AuthService,
    protected _snackBar: MatSnackBar,
    protected notification: NotificationService,
    protected dialog: MatDialog,
    protected typesService: TypesService,
    protected conditionsService: ConditionsService, 
    protected httpClient: HttpClient,
    protected sharedService: SharedService,
    protected imageCompress: NgxImageCompressService, 
    protected spotService: SpotService,
    protected breakpointObserver: BreakpointObserver, 
    protected navbarService: NavbarService
    ) {
      super(injector, route, router, fb, authService, _snackBar, notification, dialog, typesService, conditionsService, httpClient,
        sharedService, imageCompress, spotService, breakpointObserver, navbarService)
      this.user = authService.getUser();
  }

  ngOnDestroy() {
    if(this.clickEventSubscription) this.clickEventSubscription.unsubscribe();
    let SpotValue = this.resourceForm.value;
    let SpotImages = this.previews;
    localStorage.setItem('spotGeolocation', JSON.stringify(this.spotGeolocation));
    localStorage.setItem('spotValue', JSON.stringify(SpotValue));
    localStorage.setItem('spotImages', JSON.stringify(SpotImages));
    localStorage.setItem('spotCreating', 'true');
  }
  
  ngOnInit(): void {
    if (history.state.data !== undefined){
      this.spotGeolocation = history.state.data;
    } else {
      this.spotGeolocation = JSON.parse(localStorage.getItem('spotGeolocation') || '{}' )
    }
    this.resourceForm = this.fb.group({
      name: [null,Validators.required],
      types: [null, Validators.required],
      conditions: [null, Validators.required],
      street_number: [null], //* possible to write
      route: [null, Validators.required], //* possible to write
      point_of_interest: [null], //* possible to write
      postal_code: [null],
      city: [null, Validators.required],
      state: [null, Validators.required],
      country: [null, Validators.required],
    });
    if(localStorage.getItem('spotCreating') === 'true'){
      this.getTypes();
      this.getConditions();
      let spot = JSON.parse(localStorage.getItem('spotValue') || '{}')
      this.previews = JSON.parse(localStorage.getItem('spotImages') || '{}') 
      this.resourceForm = this.fb.group({
        name: spot.name,
        types: [null, Validators.required],
        conditions: [null, Validators.required],
        street_number: spot.street_number,
        route: spot.route,
        point_of_interest: spot.point_of_interest,
        postal_code: spot.postal_code,
        city: spot.city,
        state: spot.state,
        country: spot.country
      });
      this.historyData = JSON.parse(localStorage.getItem('spotGeolocation') || '{}')
      this.clickEventSubscription = this.sharedService.getClickEvent().subscribe( ()=> {
        this.save();
      });
    } else if(history.state.data == undefined){
      this.router.navigate(['/']);
    } else {
      if(this.user?.uid != null && this.user?.uid != undefined && this.user?.uid != ''){
        //this.resourceForm.controls['user_uid'].setValue(this.user.uid);
        this.historyData = history.state.data;
        this.resourceForm.patchValue(this.historyData.address);
        if(this.historyData.address.point_of_interest != ''){
          this.resourceForm.get('name')?.setValue('Spot '+ this.historyData.address.point_of_interest);
        }else if(this.historyData.address.route != ''){
          this.resourceForm.get('name')?.setValue('Spot '+ this.historyData.address.route);
        }
        if(this.historyData.image){
          this.previews.push(this.historyData.image);
          this.ngxCompressThumb(this.historyData.image.file, this.historyData.image.name, this.historyData.image.orientation);
          // this.historyData.images.forEach( (photo:any, index:number) => {
          //   if(index == 0){
          //     this.compressImage(photo, 70, 80).then(compressed => {
          //       this.thumbnail = {
          //         name: 'cam_'+index,
          //         file: compressed
          //       }
          //     })
          //   }
          //   this.previews.push({
          //     name: 'cam_'+index,
          //     file: photo
          //   });
          // });
        }
        this.getTypes();
        this.getConditions();
        this.clickEventSubscription = this.sharedService.getClickEvent().subscribe( ()=> {
          this.save();
        });
      }else{
        this.router.navigate(['/'])
      }
    }
    if(this.spotService.readSearchBar()){
      document.getElementById('fileInput')?.click()
    } 
  }

  getTypes(){
    this.typesService.getTypes().then( (result: QuerySnapshot) => {
      result.forEach( (res:QueryDocumentSnapshot) =>{
        this.dataTypes.push(res.data())
      });
    }).catch( err => {
      //console.log(err);
      this.notification.notify("Failed to get types, try again later!", 4000)
    });
  }

  getConditions(){
    this.conditionsService.getConditions().then( (result: QuerySnapshot) => {
      result.forEach( (res:QueryDocumentSnapshot) =>{
        this.dataConditions.push(res.data())
      });
    }).catch( err => {
      //console.log(err);
      this.notification.notify("Failed to get conditions, try again later!", 4000)
    });
  }
  
  compressImage(src:string, newX:number, newY:number) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        const elem = document.createElement('canvas');
        elem.width = newX;
        elem.height = newY;
        const ctx = elem.getContext('2d');
        let data:string = '';
        if(ctx != null){
          ctx.drawImage(img, 0, 0, newX, newY);
          data = ctx.canvas.toDataURL();
        }
        res(data);
      }
      img.onerror = error => rej(error);
    })
  }

  selectFileThumbnail(event: any): void {
    if(event.target.files && event.target.files[0]){
      let name = event.target.files[0].name;
      let reader = new FileReader();
      reader.readAsDataURL(event.target.files[0]);
      reader.onload = (e: any) => {
        name = name.replace('-'," ");
        name = name.replace(/ /g,"_");
        name = name.toLowerCase();
        name = name.split('.')[0];
        this.compressImage(e.target.result, 70, 80).then(compressed => {
          this.thumbnail = {
            name: name,
            file: compressed
          }
        })
      };
    }

    (<HTMLInputElement>document.getElementById("fileInput2")).value = '';
  }

  selectFiles(event: any): void {
    let notAddImgs:number = 0;
    this.selectedFiles = [];
    
    for (let index = 0; index < event.target.files.length; index++) {
      if(this.selectedFiles.length < (this.maxImgs - this.previews.length)){
        this.selectedFiles.push(event.target.files[index])
      }
      else{
        notAddImgs++
      }
    }

    if (this.selectedFiles && this.selectedFiles[0]) {
      const numberOfFiles = this.selectedFiles.length;
        for (let i = 0; i < numberOfFiles; i++) {
          let reader = new FileReader();
          reader.readAsDataURL(this.selectedFiles[i]);
          reader.onload = async (e: any) => {
            let name = this.selectedFiles[i].name;
            name = name.replace('-'," ");
            name = name.replace(/ /g,"_");
            name = name.toLowerCase();
            name = name.split('.')[0];
            let orientation = await this.imageCompress.getOrientation(this.selectedFiles[i]);
            this.ngxCompress(e.target.result,name, orientation);
            // this.compressImage(e.target.result, 1024, 768).then(compressed => {
            //   this.previews.push({
            //     name: name,
            //     file: compressed
            //   });
            // })
          };
      }
    }

    if(notAddImgs > 0){
      this._snackBar.open(notAddImgs + " Images were not inserted", undefined, {
        duration: 2000,
        })
    }
  }


  remove(index:any){
    if(this.previews[index].cover === false){
      this.previews.splice(index,1);
    }else{
      this.previews.splice(index,1);
      this.setCover(0);
    }
    
  }

  setCover(index:any){
    let coverIndex = this.previews.findIndex( preview => preview.cover === true );
    if(coverIndex >= 0){
      this.previews[coverIndex].cover = false;
    }
    
    this.ngxCompressThumb(this.previews[index].file, this.previews[index].name, this.previews[index].orientation);
    this.previews[index].cover = true;
    // this.compressImage(this.previews[index].file, 70, 80).then(compressed => {
    //   this.thumbnail = {
    //     name: this.previews[index].name,
    //     file: compressed,
    //     orientation: 
    //   }
    // })
  }

  removeThumbnail(){
    this.thumbnail = null;
  }

  imageResize(index: number){
    let gallery = (<HTMLDivElement>document.getElementById("gallery-item-"+index));
    gallery.classList.toggle("full");
  }

  async save(){
    if(this.previews.length > 0 && this.resourceForm.valid){
      this.disabled = true;

      if(this.thumbnail == null){
        await this.ngxCompressThumb(this.previews[0].file, this.previews[0].name, this.previews[0].orientation)
      }

      let hash = geohashForLocation([this.historyData.lat, this.historyData.lng]);
      //console.log()
      let spot: Spot = {
        name: this.resourceForm.controls['name'].value,
        address: {
          street_number: this.resourceForm.get('street_number')?.value,
          route: this.resourceForm.get('route')?.value,
          point_of_interest: this.resourceForm.get('point_of_interest')?.value,
          postal_code: this.resourceForm.get('postal_code')?.value,
          city: this.resourceForm.get('city')?.value,
          state: this.resourceForm.get('state')?.value,
          country: this.resourceForm.get('country')?.value,
        }, 
        types: this.resourceForm.controls['types'].value,
        conditions: this.resourceForm.controls['conditions'].value,
        lat: this.historyData.lat,
        lng: this.historyData.lng,
        hash: hash,
        user_uid: this.user.uid,
        user: this.user.displayName,
        status: 'active',
        created: new Date(),
        modified: new Date()
      }

      let response = await this.spotService.createSpot(spot, this.previews, this.thumbnail);
      if(response.status){
        this.spotservice.addModeration(response.uid, spot.name,'created', spot.user_uid, spot.address.country, this.user.displayName);
        this.disabled = false;
        this._snackBar.open("Spot registered successfully", undefined, {
          duration: 2000,
          }
        );

        let dialogConfig = new MatDialogConfig();
        dialogConfig = {
          maxWidth: '600px',
        }

        dialogConfig.data = [];
        dialogConfig.data.spotId = response.uid;
        let dialogRef = this.dialog.open(
          DialogShareComponent,
          dialogConfig
        );
        dialogRef.afterClosed().subscribe(result => {
          this.router.navigate(['/'],{
            state: {
              data: {
                spot_uid: response.uid,
                lat: spot.lat,
                lng: spot.lng
              }
            }
          });
        });
        //this.router.navigate(['/'])
      }else{
        //console.log("Ocorreu o erro a seguir: "+ response.data);
        //console.log(response.data);
        this._snackBar.open("Failed to register", undefined, {
          duration: 2000,
          }
        );
        this.disabled = false;
      }
    }else{

      this.resourceForm.markAllAsTouched();

      if(this.previews.length == 0){
        this._snackBar.open("Need at least 1 picture", undefined, {
          duration: 2000,
          }
        );
      }
    }
  }

  ngxCompress(image:string, name:string, orientation: DOC_ORIENTATION){
    this.imageCompress
    .compressFile(image, orientation, 60, 45, 1024, 1024)
    .then((result: DataUrl) => {
      if(this.previews.length == 0){
        this.previews.push({
          name: name,
          file: result,
          orientation: orientation,
          cover: true
        });
        this.ngxCompressThumb(result, name, orientation);
      }else{
        this.previews.push({
          name: name,
          file: result,
          orientation: orientation,
          cover: false
        });
      }
    });
  }

  async ngxCompressThumb(image:string, name:string, orientation: DOC_ORIENTATION){
    return this.imageCompress
    .compressFile(image, orientation, 100, 100, 80, 80)
    .then((result: DataUrl) => {
      this.thumbnail = {
        name: name,
        file: result,
        orientation: orientation,
        cover: true
      }
    });
  }

  // uploadMultipleFiles() {
  //   return this.imageCompress
  //     .uploadMultipleFiles()
  //     .then((multipleOrientedFiles: UploadResponse[]) => {
  //       this.imgResultMultiple = multipleOrientedFiles;
  //       console.warn(`${multipleOrientedFiles.length} files selected`);
  //     });
  // }

  protected buildResourceForm() {
    console.log('ok')
    // this.resourceForm = this.formBuilder.group({
    //   name: [null,Validators.required],
    //   types: [null, Validators.required],
    //   conditions: [null, Validators.required],
    //   street_number: [null], //* possible to write
    //   route: [null, Validators.required], //* possible to write
    //   point_of_interest: [null], //* possible to write
    //   postal_code: [null],
    //   city: [null, Validators.required],
    //   state: [null, Validators.required],
    //   country: [null, Validators.required],
    // });
  }
}
