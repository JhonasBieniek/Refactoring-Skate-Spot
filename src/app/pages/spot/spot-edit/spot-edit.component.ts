import { arrayUnion } from 'firebase/firestore';
import { sendData } from './../shared/services/sendData.service';
import { receiveData } from './../shared/services/receiveData.service';
import { NavbarService } from '../../../shared/services/navbar.service';
import { Component, Injector, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/shared/services/auth.service';
import { SpotService } from 'src/app/pages/spot/shared/services/spot.service'; 
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { SharedService } from 'src/app/shared/services/shared.service';
import { Subscription } from 'rxjs';
import { NgxImageCompressService, DOC_ORIENTATION, DataUrl } from 'ngx-image-compress';
import { BreakpointObserver } from '@angular/cdk/layout';
import { BaseSpotFormComponent } from 'src/app/shared/components/base-spot-form/base-spot-form.component';

@Component({
  selector: 'app-spot-edit',
  templateUrl: './spot-edit.component.html',
  styleUrls: ['./spot-edit.component.scss'],
  //encapsulation: ViewEncapsulation.None
})
export class SpotEditComponent extends BaseSpotFormComponent implements OnInit {


  clickEventSubscription!: Subscription;

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
      this.user = authService.getUser();
  }
  
  ngOnInit(): void {
    super.ngOnInit()
  }

    protected buildResourceForm() {
      this.resourceForm = this.formBuilder.group({
        uid: [null, Validators.required],
        user_uid: [null, Validators.required],
        name: [null,Validators.required],
        address: new FormGroup({
          city: new FormControl(null, Validators.required),
          state: new FormControl(null, Validators.required),
          country: new FormControl(null, Validators.required),
          point_of_interest: new FormControl(null),
          postal_code: new FormControl(null),
          route: new FormControl(null, Validators.required),
          street_number: new FormControl(null),
        }),
        types: [null, Validators.required],
        conditions: [null, Validators.required],
        lat: [null, Validators.required],
        lng: [null, Validators.required],
        hash: [null, Validators.required]
      });
      if(this.user.uid != null && this.user.uid != undefined && this.user.uid != ''){
        this.disabled = true;
        this.spotService.getSpotView(this.route.snapshot.params['id']).then((docSnap) => {
          if (docSnap.exists()) {
            this.data = docSnap.data();
            this.resourceForm.patchValue(this.data);
            this.dataPictures = [...this.data.pictures];
            this.thumbnail = this.data.thumbnail;
            this.getTypes();
            this.getConditions();
            this.clickEventSubscription = this.sharedService.getClickEvent().subscribe( ()=> {
              this.save();
            });
            setTimeout(()=>{ this.disabled = false; this.start = true}, 1000);
          } else {
            this.sharedService.notify("Spot not Found !", 4000);
            this.router.navigate(['/'])
          }
        });
      }else{
        this.router.navigate(['/'])
      }
  }

}
