import { ConfirmationDialogComponent } from '../../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { Subscription } from 'rxjs';
import { QueryDocumentSnapshot, QuerySnapshot, arrayUnion, arrayRemove, DocumentData } from 'firebase/firestore';
import { receiveData } from '../../services/receiveData.service';
import { sendData } from '../../services/sendData.service';
import { NavbarService } from '../../../../../shared/services/navbar.service';
import { BreakpointObserver } from '@angular/cdk/layout';
import { NgxImageCompressService, DataUrl, DOC_ORIENTATION } from 'ngx-image-compress';
import { SharedService } from '../../../../../shared/services/shared.service';
import { HttpClient } from '@angular/common/http';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SpotService } from '../../services/spot.service';
import { AuthService } from '../../../../../shared/services/auth.service';

import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OnInit, Injector, Injectable, Component } from '@angular/core';

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

    protected abstract makeNewCover(index: any): any

    //***** GET SPOT DATA *****//

    protected abstract getData(): Promise<any>
    protected abstract save(): void

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

    protected buildResourceForm() {
        this.disabled = true;
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
                if (this.resourceForm.valid && this.previews.length > 0) this.disabled = true;
            });
            setTimeout(() => { this.disabled = false; this.start = true }, 500);
        })
    }

    //***** GET SPOT DATA *****//

    redirectWithMessage(route: string, message?: string): void {
        this.disabled = false;
        if (message !== undefined) this.sharedService.notify(message, 4000);
        this.router.navigate([route], {
            state: {
                data: {
                    spot_uid: this.resourceForm.get('uid')?.value,
                    lat: this.resourceForm.get('lat')?.value,
                    lng: this.resourceForm.get('lng')?.value
                }
            }
        })
    }

    //*****IMAGE FUNCTIONS*****//

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

    setCover(index: any) {
        let coverIndex = this.previews.findIndex(preview => preview.cover === true);
        if (coverIndex >= 0) {
            this.previews[coverIndex].cover = false;
        }
        this.previews[index].cover = true;
        if (this.currentAction == "new") this.makeNewCover(index)
        if (this.currentAction == "edit") {
            localStorage.setItem('setCoverIndex', JSON.stringify(index))
            localStorage.setItem('changeThumb', 'true')
        }
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
                    if (this.previews.length > 0) this.setCover(0);
                }
            }
        })
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

    //*****IMAGE FUNCTIONS*****//
}