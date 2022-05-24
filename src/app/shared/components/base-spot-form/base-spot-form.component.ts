import { ConfirmationDialogComponent } from './../confirmation-dialog/confirmation-dialog.component';
import { Subscription } from 'rxjs';
import { Spot } from './../../../pages/spot/shared/models/spot.model';
import { geohashForLocation } from 'geofire-common';
import { QueryDocumentSnapshot, QuerySnapshot, arrayUnion, arrayRemove } from 'firebase/firestore';
import { receiveData } from './../../../pages/spot/shared/services/receiveData.service';
import { sendData } from './../../../pages/spot/shared/services/sendData.service';
import { DialogShareComponent } from './../../../pages/spot/dialog-share/dialog-share.component';
import { NavbarService } from '../../services/navbar.service';
import { BreakpointObserver } from '@angular/cdk/layout';
import { NgxImageCompressService, DataUrl, DOC_ORIENTATION } from 'ngx-image-compress';
import { SharedService } from '../../services/shared.service';
import { HttpClient } from '@angular/common/http';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SpotService } from '../../../pages/spot/shared/services/spot.service';
import { AuthService } from '../../services/auth.service';

import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Directive, OnInit, Injector, Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export abstract class BaseSpotFormComponent implements OnInit {

    currentAction!: string;
    resourceForm!: FormGroup;
    data: any;
    disabled: boolean = false;

    dataPictures: any[] = [];
    start: boolean = false;
    historyData: any;
    selectedFiles: any[] = [];
    previews: any[] = [];
    thumbnail: any;
    maxImgs: number = 9;
    dataTypes: any[] = [];
    dataConditions: any[] = [];
    user!: any;

    spotGeolocation: any;
    insertedFiles: number = 0;
    watchID!: number;
    clickEventSubscription!: Subscription;

    protected formBuilder: FormBuilder;

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
        this.formBuilder = this.injector.get(FormBuilder);
        this.user = authService.getUser();
    }

    ngOnInit(): void {
        this.setCurrentAction();
        this.buildResourceForm();
    }

    ngOnDestroy(): void {
        if (this.clickEventSubscription) this.clickEventSubscription.unsubscribe();
    }

    protected setCurrentAction() {
        if (this.router.url.includes('edit'))
            this.currentAction = "edit"
        else
            this.currentAction = "new"
    }

    protected abstract buildResourceForm(): void;

    //SPOT FUNCTIONS
    getTypes() {
        this.receiveData.getTypes().then((result: QuerySnapshot) => {
            result.forEach((res: QueryDocumentSnapshot) => {
                this.dataTypes.push(res.data())
            });
            if (this.currentAction == "edit") {
                this.data.types.forEach((type: any) => {
                    const index = this.dataTypes.findIndex((e: any) => { return e.name === type });
                    if (index === -1) this.dataTypes.push({ name: type, status: false })
                });
            }
        }).catch(err => {
            //console.log(err);
            this.sharedService.notify("Failed to get types, try again later!", 4000)
        });
    }

    getConditions() {
        this.receiveData.getConditions().then((result: QuerySnapshot) => {
            result.forEach((res: QueryDocumentSnapshot) => {
                this.dataConditions.push(res.data())
            });
            if (this.currentAction == "edit" && this.data.conditions) {
                const index = this.dataConditions.findIndex((e: any) => { return e.name === this.data.conditions });
                if (index === -1) this.dataConditions.push({ name: this.data.conditions, status: false })
            }
        }).catch(err => {
            //console.log(err);
            this.sharedService.notify("Failed to get conditions, try again later!", 4000)
        });
    }

    selectFiles(event: any): void {
        let notAddImgs: number = 0;
        this.selectedFiles = [];

        for (let index = 0; index < event.target.files.length; index++) {
            if (this.selectedFiles.length < (this.maxImgs - this.previews.length)) {
                this.selectedFiles.push(event.target.files[index])
            }
            else {
                notAddImgs++
            }
        }

        if (this.selectedFiles && this.selectedFiles[0]) {
            // this.disabled = true;
            const numberOfFiles = this.selectedFiles.length;
            for (let i = 0; i < numberOfFiles; i++) {
                let reader = new FileReader();
                reader.readAsDataURL(this.selectedFiles[i]);
                reader.onload = async (e: any) => {
                    let name = this.selectedFiles[i].name;
                    name = name.replace('-', " ");
                    name = name.replace(/ /g, "_");
                    name = name.toLowerCase();
                    name = name.split('.')[0];
                    let orientation = await this.imageCompress.getOrientation(this.selectedFiles[i]);
                    if (this.currentAction == "new") this.ngxCompress(e.target.result, name, orientation);
                    if (this.currentAction == "edit") {
                        let cover: boolean = false;
                        if (this.dataPictures.length == 0 && i == 0) cover = true;
                        this.updatePictures(name, e.target.result, orientation, i + 1 == numberOfFiles ? true : false, cover);
                    }
                };
            }
        }

        if (notAddImgs > 0) {
            this._snackBar.open(notAddImgs + " Images were not inserted", undefined, {
                duration: 2000,
            })
        }
    }


    remove(index: any) {
        if (this.currentAction == "edit") {
            let dialogConfig = new MatDialogConfig();
            dialogConfig = {
                maxWidth: '600px',
            }
            dialogConfig.data = [];
            dialogConfig.data.message = "Do you want to remove this picture?";
            dialogConfig.data.confirm = "Confirm";
            dialogConfig.data.cancel = "Cancel";

            let dialogRef = this.dialog.open(ConfirmationDialogComponent, dialogConfig);
            dialogRef.afterClosed().subscribe(result => {
                if (result) {
                    this.disabled = true;
                    this.spotService.deleteImage(this.dataPictures[index].path).then((response) => {
                        this.spotService.updateSpot(this.resourceForm.get('uid')?.value, { pictures: arrayRemove(this.dataPictures[index]) }).then((responsePic) => {
                            let imageCover = this.dataPictures[index].cover;
                            this.dataPictures.splice(index, 1);
                            if (imageCover === true) {
                                this.sharedService.notify("Picture deleted successfully, setting new cover !", 4000);
                                this.setCover(0);
                            } else {
                                this.disabled = false;
                                this.sharedService.notify("Picture deleted successfully !", 4000);
                            }

                        }).catch((error) => {
                            this.disabled = false;
                            this.sharedService.notify("An error occurred, try again later!", 4000);
                            //console.log(error);
                        });
                    }).catch((error) => {
                        this.disabled = false;
                        this.sharedService.notify("An error occurred, try again later!", 4000);
                        //.log(error);
                    });
                }
            });
        } else {
            if (this.previews[index].cover === false) {
                this.previews.splice(index, 1);
            } else {
                this.previews.splice(index, 1);
                this.setCover(0);
            }
        }
    }

    setCover(index: any) {
        if (this.currentAction == "new") {
            let coverIndex = this.previews.findIndex(preview => preview.cover === true);
            if (coverIndex >= 0) {
                this.previews[coverIndex].cover = false;
            }

            this.ngxCompressThumb(this.previews[index].file, this.previews[index].name, this.previews[index].orientation);
            this.previews[index].cover = true;
        } else {
            this.disabled = true;
            const imgUrl = this.dataPictures[index].downloadURL;
            // console.log(imgUrl)
            const imgName = "cover";
            this.httpClient.get(imgUrl, { responseType: 'blob' as 'json' })
                .subscribe((res: any) => {
                    const file = new Blob([res], { type: res.type });

                    let reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = (e: any) => {
                        //console.log(this.dataPictures[index])
                        this.imageCompress
                            .compressFile(e.target.result, this.dataPictures[index].orientation, 100, 100, 80, 80)
                            .then((result: DataUrl) => {
                                if (this.thumbnail == null) {
                                    this.updateThumbnail(imgName, result, this.dataPictures[index].orientation, index);
                                } else {
                                    //* Remover o thumbmail anterior do banco
                                    this.spotService.deleteImage(this.thumbnail.path).then((response) => {
                                        this.spotService.updateSpot(this.resourceForm.get('uid')?.value, { thumbnail: null }).then((responseThumbnail) => {
                                            this.thumbnail = null;
                                            this.disabled = false;
                                            this.updateThumbnail(imgName, result, this.dataPictures[index].orientation, index);
                                        }).catch((error) => {
                                            this.disabled = false;
                                            this.sharedService.notify("An error occurred, try again later!", 2000);
                                            //console.log(error);
                                        });
                                    }).catch((error) => {
                                        this.disabled = false;
                                        this.sharedService.notify("An error occurred, try again later!", 2000);
                                        //console.log(error);
                                    });
                                };
                            });
                    };
                }, err => {
                    //console.log(err);
                    this.disabled = false;
                    this.sharedService.notify("An error occurred, try again later!", 2000);
                });
        }
    }

    imageResize(index: number) {
        let gallery = (<HTMLDivElement>document.getElementById("gallery-item-" + index));
        gallery.classList.toggle("full");
    }

    async save() {
        if (this.previews.length > 0 || this.dataPictures.length > 0 && this.resourceForm.valid) {
            if (this.currentAction == "new") {
                this.disabled = true;
                if (this.thumbnail == null) {
                    await this.ngxCompressThumb(this.previews[0].file, this.previews[0].name, this.previews[0].orientation)
                }
                let hash = geohashForLocation([this.historyData.lat, this.historyData.lng]);
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
                if (response.status) {
                    this.sendData.addModeration(response.uid, spot.name, 'created', spot.user_uid, spot.address.country, this.user.displayName);
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
                        this.router.navigate(['/'], {
                            state: {
                                data: {
                                    spot_uid: response.uid,
                                    lat: spot.lat,
                                    lng: spot.lng
                                }
                            }
                        });
                    });
                } else {
                    this._snackBar.open("Failed to register", undefined, {
                        duration: 2000,
                    }
                    );
                    this.disabled = false;
                }
            } else { 
                this.disabled = true;
                this.spotService.updateSpot(this.resourceForm.get('uid')?.value, this.resourceForm.value).then((response) => {
                    this.sendData.addModeration(this.resourceForm.get('uid')?.value, this.resourceForm.get('name')?.value, 'infos modified', this.user.uid, this.resourceForm.get('address.country')?.value, this.user.displayName);
                    this.disabled = false;
                    this.sharedService.notify("Spot updated successfully !", 4000);
                    //this.clickEventSubscription.unsubscribe();
                    this.router.navigate(['/'], {
                        state: {
                            data: {
                                spot_uid: this.resourceForm.get('uid')?.value,
                                lat: this.resourceForm.get('lat')?.value,
                                lng: this.resourceForm.get('lng')?.value
                            }
                        }
                    });
                }).catch((error) => {
                    this.disabled = false;
                    this.sharedService.notify("An error occurred, try again later!", 4000);
                    console.log(error);
                });
            }
        } else {
            this.resourceForm.markAllAsTouched();
            if (this.previews.length == 0) {
                this._snackBar.open("Need at least 1 picture", undefined, {
                    duration: 2000,
                }
                );
            }
        }
    }
    //SPOT FUNCTIONS




    //SPOT FUNCTIONS AUXILIAR

    ngxCompress(image: string, name: string, orientation: DOC_ORIENTATION) {
        this.imageCompress
            .compressFile(image, orientation, 60, 45, 1024, 1024)
            .then((result: DataUrl) => {
                if (this.previews.length == 0) {
                    this.previews.push({
                        name: name,
                        file: result,
                        orientation: orientation,
                        cover: true
                    });
                    this.ngxCompressThumb(result, name, orientation);
                } else {
                    this.previews.push({
                        name: name,
                        file: result,
                        orientation: orientation,
                        cover: false
                    });
                }
            });
    }

    async ngxCompressThumb(image: string, name: string, orientation: DOC_ORIENTATION) {
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

    //SPOT FUNCTIONS AUXILIAR


    //SPOT EDIT FUNCTIONS AUXILIAR
    updateThumbnail(name: string, file: any, orientation: DOC_ORIENTATION, cover_index: number) {
        this.disabled = true;
        let path = "spots/" + this.resourceForm.get('uid')?.value + "/" + name + "_thumbnail.png";
        this.spotService.uploadImageAsPromise(file, path, orientation, true).then((response) => {
            this.thumbnail = response;
            this.dataPictures.forEach(pictures => {
                if (pictures.cover === true) pictures.cover = false;
            });
            this.dataPictures[cover_index].cover = true;
            this.spotService.updateSpot(this.resourceForm.get('uid')?.value, { thumbnail: response, pictures: this.dataPictures }).then(() => {
                // , status: 'image modified'
                //this.spotService.addModeration(this.resourceForm.get('uid')?.value, this.data.name,'image modified');
                this.disabled = false;
                this.sharedService.notify("Thumbnail updated successfully !", 4000);

            }).catch((error) => {
                this.disabled = false;
                this.sharedService.notify("An error occurred, try again later!", 4000);
                //console.log(error);
            });
        }).catch((error) => {
            this.disabled = false;
            this.sharedService.notify("An error occurred, try again later!", 4000);
            //console.log(error);
        });
    }

    updatePictures(name: string, file: any, orientation: DOC_ORIENTATION, last: boolean, cover: boolean) {
        this.imageCompress
            .compressFile(file, orientation, 60, 45, 1024, 1024)
            .then((result: DataUrl) => {

                let path = "spots/" + this.resourceForm.get('uid')?.value + "/" + name + "_" + Date.now() + ".png";
                this.spotService.uploadImageAsPromise(result, path, orientation, cover).then((response) => {
                    this.spotService.updateSpot(this.resourceForm.get('uid')?.value, { pictures: arrayUnion(response) }).then((responsePic) => {
                        if (last == true) {
                            this.sendData.addModeration(this.resourceForm.get('uid')?.value, this.data.name, 'image modified', this.user.uid, this.resourceForm.get('address.country')?.value, this.user.displayName);
                            this.disabled = false;
                            this.sharedService.notify("Pictures updated successfully !", 4000);
                        }
                        this.dataPictures.push(response);
                        if (cover) this.setCover(0);

                    }).catch((error) => {
                        this.disabled = false;
                        this.sharedService.notify("An error occurred, try again lateeer!", 4000);
                        console.log(error.message);
                    });
                }).catch((error) => {
                    this.disabled = false;
                    this.sharedService.notify("An error occurred, try again later!", 4000);
                    //console.log(error);
                });
            });
    }


    //SPOT EDIT FUNCTIONS AUXILIAR
}