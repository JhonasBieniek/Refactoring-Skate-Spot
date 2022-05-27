import { receiveData } from './shared/services/receiveData.service';
import { sendData } from './shared/services/sendData.service';
import { HttpClient } from '@angular/common/http';
import { BreakpointObserver } from '@angular/cdk/layout';
import { BaseSpotFormComponent } from 'src/app/shared/components/base-spot-form/base-spot-form.component';
import { NavbarService } from '../../shared/services/navbar.service';
import { Spot, imgFiles, Address } from './shared/models/spot.model';
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
import { resolve } from 'dns';

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
    
  }

  ngOnInit(): void {
    super.ngOnInit()
  }

  protected async getData(): Promise<any> {
    this.currentAction = "new";
    return await new Promise<any>((resolve, reject) => {
      if (history.state.data !== undefined) {
        resolve(history.state.data);
      } else {
        this.router.navigate(['/']);
      }
    })
  }
}