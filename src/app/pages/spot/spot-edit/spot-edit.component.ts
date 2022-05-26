import { arrayUnion, arrayRemove } from 'firebase/firestore';
import { sendData } from './../shared/services/sendData.service';
import { receiveData } from './../shared/services/receiveData.service';
import { NavbarService } from '../../../shared/services/navbar.service';
import { Component, Injector, OnInit, Injectable } from '@angular/core';
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

  protected getData(): any{
    this.spotService.getSpotView(this.route.snapshot.params['id']).then((docSnap) => {
      if (docSnap.exists()) {
        this.currentAction = "edit";
        this.data = docSnap.data();
        this.spotPictures = [...this.data.pictures]
        this.previews = [...this.data.pictures]
        this.thumbnail = this.data.thumbnail;
        this.buildResourceForm(this.data)
      } else {
        this.sharedService.notify("Spot not Found !", 4000);
        this.router.navigate(['/'])
      }
    });
  }

  protected spotUpdate(): any{
    
  }


}
