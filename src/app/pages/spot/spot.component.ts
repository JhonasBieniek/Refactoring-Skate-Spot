import { receiveData } from './shared/services/receiveData.service';
import { sendData } from './shared/services/sendData.service';
import { HttpClient } from '@angular/common/http';
import { BreakpointObserver } from '@angular/cdk/layout';
import { BaseSpotFormComponent } from 'src/app/pages/spot/shared/components/base-spot-form/base-spot-form.component';
import { NavbarService } from '../../shared/services/navbar.service';
import { Component, OnInit, Injector } from '@angular/core';
import { FormBuilder} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/shared/services/auth.service';
import { SpotService } from 'src/app/pages/spot/shared/services/spot.service';
import { geohashForLocation } from 'geofire-common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DialogShareComponent } from './dialog-share/dialog-share.component';
import { SharedService } from 'src/app/shared/services/shared.service';
import { NgxImageCompressService } from 'ngx-image-compress';

@Component({
  selector: 'app-spot',
  templateUrl: './spot.component.html',
  styleUrls: ['./spot.component.scss'],
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
    if (this.clickEventSubscription) this.clickEventSubscription.unsubscribe();
    localStorage.setItem('spotValue', JSON.stringify(this.resourceForm?.value != undefined ? this.resourceForm.value : null));
    localStorage.setItem('spotImages', JSON.stringify(this.previews));
    localStorage.setItem('spotThumbnail', JSON.stringify(this.thumbnail))
    localStorage.setItem('spotCreating', 'true');
  }

  ngOnInit(): void {
    super.ngOnInit()
  }

  protected async getData(): Promise<any> {
    this.currentAction = "new";
    return await new Promise<any>((resolve, reject) => {
      if (history.state.data !== undefined) {
        resolve(history.state.data);
      } else if (localStorage.getItem('spotCreating') == "true") {
        this.previews = JSON.parse(localStorage.getItem('spotImages') || '{}')
        this.thumbnail = JSON.parse(localStorage.getItem('spotThumbnail') || '{}')
        resolve(JSON.parse(localStorage.getItem('spotValue') || '{}'));
      } else {
        this.router.navigate(['/']);
      }
    })
  }

  protected makeNewCover(index: any): any {
    this.ngxCompressThumb(this.previews[index].downloadURL, this.previews[index].name, this.previews[index].orientation);
  }

  protected save(): void {
    if (this.previews.length > 0 && this.resourceForm.valid) {
      let hash = geohashForLocation([this.data.lat, this.data.lng]);
      this.resourceForm.get('hash')?.setValue(hash)
      this.resourceForm.get('status')?.setValue('active')
      this.resourceForm.get('created')?.setValue(new Date())
      this.resourceForm.get('modified')?.setValue(new Date())
      this.spotService.createSpot(this.resourceForm.value, this.previews, this.thumbnail).then((response) => {
        //ADDMODERATION ESTA DANDO PROBLEMAS AO INSERIR UM SPOT COM OS DADOS DO LOCALSTORAGE DEPOIS DE RECARREGAR A PAGINA
        this.sendData.addModeration(response.uid, this.resourceForm.get('name')?.value, 'created', this.user.uid, this.resourceForm.get('address.country')?.value, this.user.displayName);
        this.disabled = false;
        this._snackBar.open("Spot registered successfully", undefined, {
          duration: 2000,
        });
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
          this.router.navigate(['/'], {
            state: {
              data: {
                spot_uid: response.uid,
                lat: this.data.lat,
                lng: this.data.lng
              }
            }
          });
        });
      }).catch(() => {
        this._snackBar.open("Failed to register", undefined, {
          duration: 2000,
        });
        this.disabled = false;
      })
      this.disabled = false;
    } else {
      this.resourceForm.markAllAsTouched();
      if (this.previews.length == 0) {
        this.disabled = false;
        this._snackBar.open("Need at least 1 picture", undefined, {
          duration: 2000,
        });
      }
    }
  }

}