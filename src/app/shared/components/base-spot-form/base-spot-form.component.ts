import { Types } from './../../../pages/spot/shared/models/type.model';
import { ConfirmationDialogComponent } from './../confirmation-dialog/confirmation-dialog.component';
import { Subscription } from 'rxjs';
import { Spot } from './../../../pages/spot/shared/models/spot.model';
import { geohashForLocation } from 'geofire-common';
import { QueryDocumentSnapshot, QuerySnapshot, arrayUnion, arrayRemove, DocumentData } from 'firebase/firestore';
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

import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Directive, OnInit, Injector, Injectable } from '@angular/core';
import { threadId } from 'worker_threads';

@Injectable({
    providedIn: 'root'
})
export abstract class BaseSpotFormComponent implements OnInit {

    currentAction!: string;
    resourceForm!: FormGroup;
    data: any;
    disabled: boolean = false;
    start: boolean = false;
    selectedFiles: any[] = [];
    previews: any[] = [];
    thumbnail: any;
    maxImgs: number = 9;
    dataTypes: any[] = [];
    dataConditions: any[] = [];
    user: any;
    deletedImagesIndex: any[] = [];
    spotPictures: any[] = [];
    spotGeolocation!: Object;
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
        this.buildResourceForm();
    }

    ngOnDestroy(): void {
        if (this.clickEventSubscription) this.clickEventSubscription.unsubscribe();
        if(this.currentAction == "new"){
            localStorage.setItem('spotValue', JSON.stringify(this.resourceForm.value));
            console.log(this.resourceForm.value)
            localStorage.setItem('spotImages', JSON.stringify(this.previews));
            localStorage.setItem('spotCreating', 'true');
        }
    }

    protected abstract getData(): Promise<any>

    protected buildResourceForm() {
        this.disabled = true;
        if(localStorage.getItem('spotCreating') === 'true'){
            let spotData = JSON.parse(localStorage.getItem('spotValue') || '{}');
            this.data = spotData;
            this.previews = JSON.parse(localStorage.getItem('spotImages') || '{}');
        } else {
            this.getData().then((data) => {
                this.data = data
                this.resourceForm = this.formBuilder.group({
                    uid: [this.data.uid !== null || this.data.uid !== undefined ? this.data.uid : null],
                    user: [this.user.displayName, Validators.required],
                    user_uid: [this.user.uid !== null || this.user.uid !== undefined ? this.user.uid : null],
                    name: [this.data.name !== null || this.data.name !== undefined ? this.data.name : null],
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
                    hash: [this.data.hash !== null || this.data.hash !== undefined ? this.data.hash : null],
                    status: [null],
                    created: [null],
                    modified: [null]
                })
                this.resourceForm.patchValue(this.data)
                if (this.currentAction == "new") {
                    if (this.data.address.point_of_interest != '') {
                        this.resourceForm.get('name')?.setValue('Spot ' + this.data.address.point_of_interest);
                    } else if (this.data.address.route != '') {
                        this.resourceForm.get('name')?.setValue('Spot ' + this.data.address.route);
                    }
                }
                this.getTypes();
                this.getConditions();
                this.clickEventSubscription = this.sharedService.getClickEvent().subscribe(() => {
                    this.save();
                });
                setTimeout(() => { this.disabled = false; this.start = true }, 500);
            })
        }
    }

    setAction(index: any): any {
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
                                        this.disabled = false;
                                        this.sharedService.notify("Spot updated successfully !", 4000);
                                        this.router.navigate(['/'], {
                                            state: {
                                                data: {
                                                    spot_uid: this.resourceForm.get('uid')?.value,
                                                    lat: this.resourceForm.get('lat')?.value,
                                                    lng: this.resourceForm.get('lng')?.value
                                                }
                                            }
                                        })
                                    } else {
                                        this.thumbnail = null;
                                        this.updateThumbnail(imgName, result, this.previews[index].orientation, index);
                                        this.disabled = false;
                                        this.disabled = false;
                                        this.sharedService.notify("Spot updated successfully !", 4000);
                                        this.router.navigate(['/'], {
                                            state: {
                                                data: {
                                                    spot_uid: this.resourceForm.get('uid')?.value,
                                                    lat: this.resourceForm.get('lat')?.value,
                                                    lng: this.resourceForm.get('lng')?.value
                                                }
                                            }
                                        })
                                    };
                                });
                        };
                    }, err => {
                        //console.log(err);
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

    setCover(index: any) {
        let coverIndex = this.previews.findIndex(preview => preview.cover === true);
        if (coverIndex >= 0) {
            this.previews[coverIndex].cover = false;
        }
        if (this.currentAction == "new") this.ngxCompressThumb(this.previews[index].downloadURL, this.previews[index].name, this.previews[index].orientation);
        this.previews[index].cover = true;
        if (this.currentAction == "edit") {
            localStorage.setItem('setCoverIndex', JSON.stringify(index))
            localStorage.setItem('changeThumb', 'true')
        }
    }

    async save() {
        if (this.previews.length > 0 && this.resourceForm.valid) {
            this.disabled = true;
            if (this.currentAction == "new") {
                let hash = geohashForLocation([this.data.lat, this.data.lng]);
                this.resourceForm.get('hash')?.setValue(hash)
                this.resourceForm.get('status')?.setValue('active')
                this.resourceForm.get('created')?.setValue(new Date())
                this.resourceForm.get('modified')?.setValue(new Date())
                this.spotService.createSpot(this.resourceForm.value, this.previews, this.thumbnail).then((response) => {
                    this.sendData.addModeration(response.uid, this.resourceForm.get('name')?.value, 'created', this.user.uid, this.resourceForm.get('address.country')?.value, this.user.displayName);
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
                })
                this.disabled = false;
                this.currentAction = ""
            } else {
                this.spotService.updateSpot(this.resourceForm.get('uid')?.value, this.resourceForm.value).then((response) => {
                    this.sendData.addModeration(this.resourceForm.get('uid')?.value, this.resourceForm.get('name')?.value, 'infos modified', this.user.uid, this.resourceForm.get('address.country')?.value, this.user.displayName);
                    if (this.deletedImagesIndex.length > 0) {
                        this.deletedImagesIndex.forEach(index => {
                            this.spotService.updateSpot(this.resourceForm.get('uid')?.value, { pictures: arrayRemove(this.spotPictures[index]) })
                        });
                    }
                    this.spotService.updateSpot(this.resourceForm.get('uid')?.value, { pictures: this.previews }).then(() => {
                        // this.sendData.addModeration(this.resourceForm.get('uid')?.value, this.resourceForm.get('name')?.value, 'image modified', this.user.uid, this.resourceForm.get('address.country')?.value, this.user.displayName);
                        let coverIndex = JSON.parse(localStorage.getItem('setCoverIndex') || '{}')
                        let changeThumb = localStorage.getItem('changeThumb');
                        localStorage.removeItem('setCoverIndex')
                        localStorage.removeItem('changeThumb')
                        if (changeThumb !== null) {
                            this.setAction(coverIndex)
                        } else {
                            this.disabled = false;
                            this.sharedService.notify("Spot updated successfully !", 4000);
                            this.router.navigate(['/'], {
                                state: {
                                    data: {
                                        spot_uid: this.resourceForm.get('uid')?.value,
                                        lat: this.resourceForm.get('lat')?.value,
                                        lng: this.resourceForm.get('lng')?.value
                                    }
                                }
                            })
                        }
                    })
                }).catch((error) => {
                    this.disabled = false;
                    this.sharedService.notify("An error occurred, try again later!", 4000);
                    console.log(error);
                });
                this.currentAction = ""
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
                    this.ngxCompress(e.target.result, name, orientation);
                };
            }
        }

        if (notAddImgs > 0) {
            this._snackBar.open(notAddImgs + " Images were not inserted", undefined, {
                duration: 2000,
            })
        }
    }

    ngxCompress(image: string, name: string, orientation: DOC_ORIENTATION) {
        this.imageCompress
            .compressFile(image, orientation, 60, 45, 1024, 1024)
            .then((result: DataUrl) => {
                if (this.previews.length == 0) {
                    this.previews.push({
                        name: name,
                        downloadURL: result,
                        orientation: orientation,
                        cover: true
                    });
                    this.ngxCompressThumb(result, name, orientation);
                } else {
                    this.previews.push({
                        name: name,
                        downloadURL: result,
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
                    downloadURL: result,
                    orientation: orientation,
                    cover: true
                }
            });
    }



    imageResize(index: number) {
        let gallery = (<HTMLDivElement>document.getElementById("gallery-item-" + index));
        gallery.classList.toggle("full");
    }

    remove(index: any) {
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
                if (this.previews[index].cover === false) {
                    if (this.previews[index].downloadURL.indexOf('firebase') !== -1) {
                        this.deletedImagesIndex.push(index)
                    }
                    this.previews.splice(index, 1);
                } else {
                    if (this.previews[index].downloadURL.indexOf('firebase') !== -1) {
                        this.deletedImagesIndex.push(index)
                    }
                    this.previews.splice(index, 1);
                    this.setCover(0);
                }
            }
        })
    }
    updatePictures(name: string, file: any, orientation: DOC_ORIENTATION, last: boolean, cover: boolean) {
        this.imageCompress
            .compressFile(file, orientation, 60, 45, 1024, 1024)
            .then((result: DataUrl) => {
                let path = "spots/" + this.resourceForm.get('uid')?.value + "/" + name + "_" + Date.now() + ".png";
                this.spotService.uploadImageAsPromise(result, path, orientation, cover).then((response) => {
                    this.spotService.updateSpot(this.resourceForm.get('uid')?.value, { pictures: arrayUnion(response) }).then((responsePic) => {
                        if (last == true) {
                            // this.sendData.addModeration(this.resourceForm.get('uid')?.value, this.resourceForm.get('name')?.value, 'image modified', this.user.uid, this.resourceForm.get('address.country')?.value, this.user.displayName);
                            this.disabled = false;
                        }
                        this.previews.push(response);
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

    updateThumbnail(name: string, file: any, orientation: DOC_ORIENTATION, cover_index: number) {
        this.disabled = true;
        let path = "spots/" + this.resourceForm.get('uid')?.value + "/" + name + "_thumbnail.png";
        this.spotService.uploadImageAsPromise(file, path, orientation, true).then((response) => {
            this.thumbnail = response;
            this.previews.forEach(pictures => {
                if (pictures.cover === true) pictures.cover = false;
            });
            this.previews[cover_index].cover = true;
            this.spotService.updateSpot(this.resourceForm.get('uid')?.value, { thumbnail: response, pictures: this.previews }).then(() => {
                this.disabled = false;
            }).catch((error) => {
                this.disabled = false;
                this.sharedService.notify("An error occurred, try again later!", 4000);
            });
        }).catch((error) => {
            this.disabled = false;
            this.sharedService.notify("An error occurred, try again later!", 4000);
        });
    }
}