import { arrayRemove } from 'firebase/firestore';
import { sendData } from './../shared/services/sendData.service';
import { receiveData } from './../shared/services/receiveData.service';
import { NavbarService } from '../../../shared/services/navbar.service';
import { Component, Injector, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/shared/services/auth.service';
import { SpotService } from 'src/app/pages/spot/shared/services/spot.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { SharedService } from 'src/app/shared/services/shared.service';
import { Subscription } from 'rxjs';
import { NgxImageCompressService, DataUrl } from 'ngx-image-compress';
import { BreakpointObserver } from '@angular/cdk/layout';
import { BaseSpotFormComponent } from 'src/app/pages/spot/shared/components/base-spot-form/base-spot-form.component';

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

  ngOnDestroy(): void {
    if (this.clickEventSubscription) this.clickEventSubscription.unsubscribe();
  }

  ngOnInit(): void {
    super.ngOnInit()
  }

  protected async getData(): Promise<any> {
    this.currentAction = "edit";
    return await new Promise<any>((resolve, reject) => {
      this.spotService.getSpotView(this.route.snapshot.params['id']).then((docSnap) => {
        if (docSnap.exists()) {
          this.data = docSnap.data();
          this.previews = [...this.data.pictures];
          this.spotPictures = [...this.data.pictures];
          this.thumbnail = this.data.thumbnail;
          resolve(docSnap.data())
        } else {
          this.sharedService.notify("Spot not Found !", 4000);
          this.router.navigate(['/'])
        }
      })
    })
  }

  protected save(): void {
    if (this.previews.length > 0 && this.resourceForm.valid) {
      this.spotService.updateSpot(this.resourceForm.get('uid')?.value, this.resourceForm.value).then((response) => {
        this.sendData.addModeration(this.resourceForm.get('uid')?.value, this.resourceForm.get('name')?.value, 'infos modified', this.user.uid, this.resourceForm.get('address.country')?.value, this.user.displayName);
        if (this.deletedImagesIndex.length > 0) {
          this.deletedImagesIndex.forEach(index => {
            this.spotService.updateSpot(this.resourceForm.get('uid')?.value, { pictures: arrayRemove(this.spotPictures[index]) })
          });
        }
        this.spotService.updateSpot(this.resourceForm.get('uid')?.value, { pictures: this.previews }).then(() => {
          this.sendData.addModeration(this.resourceForm.get('uid')?.value, this.resourceForm.get('name')?.value, 'image modified', this.user.uid, this.resourceForm.get('address.country')?.value, this.user.displayName);
          let coverIndex = JSON.parse(localStorage.getItem('setCoverIndex') || '{}')
          let changeThumb = localStorage.getItem('changeThumb');
          localStorage.removeItem('setCoverIndex')
          localStorage.removeItem('changeThumb')
          if (changeThumb !== null) {
            this.makeNewCover(coverIndex)
          } else {
            this.redirectWithMessage('/', "Spot updated successfully !")
          }
        })
      }).catch((error) => {
        this.disabled = false;
        this.sharedService.notify("An error occurred, try again later!", 4000);
        console.log(error);
      });
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


  protected makeNewCover(index: any): any {
    this.disabled = true;
    this.spotService.deleteImage(this.thumbnail.path).then((response) => {
      this.spotService.updateSpot(this.resourceForm.get('uid')?.value, { thumbnail: null }).then(() => {
        const imgUrl = this.previews[index].downloadURL;
        const imgName = "cover";
        this.httpClient.get(imgUrl, { responseType: 'blob' as 'json' })
          .subscribe((res: any) => {
            const file = new Blob([res], { type: res.type });
            let reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e: any) => {
              this.imageCompress
                .compressFile(e.target.result, this.previews[index].orientation, 100, 100, 80, 80)
                .then((result: DataUrl) => {
                  if (this.thumbnail == null) {
                    this.updateThumbnail(imgName, result, this.previews[index].orientation, index);
                    super.redirectWithMessage('/', "Spot updated successfully !")
                  } else {
                    this.thumbnail = null;
                    this.updateThumbnail(imgName, result, this.previews[index].orientation, index);
                    super.redirectWithMessage('/', "Spot updated successfully !")
                  };
                });
            };
          }, err => {
            console.log(err);
            this.disabled = false;
            this.sharedService.notify("An error occurred, try again later!", 2000);
          });
      }).catch((error) => {
        console.log(error)
        this.disabled = false;
        this.sharedService.notify("An error occurred, try again later!", 2000);
      })
    }).catch((error) => {
      console.log(error)
      this.disabled = false;
      this.sharedService.notify("An error occurred, try again later!", 2000);
    })
  }
}
