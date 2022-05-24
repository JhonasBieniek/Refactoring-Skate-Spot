import { receiveData } from './shared/services/receiveData.service';
import { sendData } from './shared/services/sendData.service';
import { HttpClient } from '@angular/common/http';
import { BreakpointObserver } from '@angular/cdk/layout';
import { BaseSpotFormComponent } from 'src/app/shared/components/base-spot-form/base-spot-form.component';
import { NavbarService } from '../../shared/services/navbar.service';
import { Spot, imgFiles } from './shared/models/spot.model';
import { Component, OnInit, ViewEncapsulation, Injector } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/shared/services/auth.service';
import { SpotService } from 'src/app/pages/spot/shared/services/spot.service'; 
import { geohashForLocation } from 'geofire-common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DialogShareComponent } from './dialog-share/dialog-share.component';
import { QueryDocumentSnapshot, QuerySnapshot } from 'firebase/firestore';
import { Subscription } from 'rxjs';
import { SharedService } from 'src/app/shared/services/shared.service';
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

  constructor(
    protected injector: Injector,
    protected route: ActivatedRoute,
    protected router: Router,
    protected fb: FormBuilder,
    protected authService: AuthService,
    protected sendData: sendData,
    protected receiveData: receiveData,
    protected _snackBar: MatSnackBar,
    protected dialog: MatDialog,
    protected httpClient: HttpClient,
    protected sharedService: SharedService,
    protected imageCompress: NgxImageCompressService, 
    protected spotService: SpotService,
    protected breakpointObserver: BreakpointObserver, 
    protected navbarService: NavbarService
    ) {
      super(injector, route, router, fb, authService, sendData, receiveData, _snackBar, dialog, httpClient,
        sharedService, imageCompress, spotService, breakpointObserver, navbarService)
  }

  ngOnDestroy() {
    localStorage.setItem('spotGeolocation', JSON.stringify(this.spotGeolocation));
    localStorage.setItem('spotValue', JSON.stringify(this.resourceForm.value));
    localStorage.setItem('spotImages', JSON.stringify(this.previews));
    localStorage.setItem('spotCreating', 'true');
  }
  
  ngOnInit(): void {
    super.ngOnInit()
  }

  protected buildResourceForm() {
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
    if(this.receiveData.readSearchBar()){
      document.getElementById('fileInput')?.click()
    } 
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

  removeThumbnail(){
    this.thumbnail = null;
  }




}
