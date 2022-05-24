import { sendData } from './../shared/services/sendData.service';
import { receiveData } from './../shared/services/receiveData.service';
import { NavbarService } from '../../../shared/services/navbar.service';
import { Component, Injector, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/shared/services/auth.service';
import { SpotService } from 'src/app/pages/spot/shared/services/spot.service'; 
import { MatSnackBar } from '@angular/material/snack-bar';
import { arrayRemove, arrayUnion, QueryDocumentSnapshot, QuerySnapshot } from 'firebase/firestore';
import { ConfirmationDialogComponent } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.component';
import { HttpClient } from '@angular/common/http';
import { SharedService } from 'src/app/shared/services/shared.service';
import { Subscription } from 'rxjs';
import { DataUrl, DOC_ORIENTATION, NgxImageCompressService } from 'ngx-image-compress';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { BaseSpotFormComponent } from 'src/app/shared/components/base-spot-form/base-spot-form.component';

@Component({
  selector: 'app-spot-edit',
  templateUrl: './spot-edit.component.html',
  styleUrls: ['./spot-edit.component.scss'],
  //encapsulation: ViewEncapsulation.None
})
export class SpotEditComponent extends BaseSpotFormComponent implements OnInit {
  dataPictures: any[] = [];
  start: boolean = false;
  disabled: boolean = false;
  historyData: any;
  selectedFiles: any[] = [];
  previews: any[] = [];
  thumbnail: any;
  maxImgs: number = 9;
  dataTypes: any[] = [];
  dataConditions: any[] = [];
  user!: any;

  clickEventSubscription!: Subscription;

  constructor(
    protected injector: Injector,
    protected route: ActivatedRoute,
    protected router: Router,
    protected fb: FormBuilder,
    protected authService: AuthService,
    protected receiveData: receiveData,
    protected sendData: sendData,
    protected _snackBar: MatSnackBar,
    protected dialog: MatDialog,
    protected httpClient: HttpClient,
    protected sharedService: SharedService,
    protected imageCompress: NgxImageCompressService, 
    protected spotService: SpotService,
    protected breakpointObserver: BreakpointObserver, 
    protected navbarService: NavbarService
    ) {
      super(injector, route, router, fb, authService, _snackBar, dialog, httpClient,
        sharedService, imageCompress, spotService, breakpointObserver, navbarService)
      this.user = authService.getUser();
  }

  ngOnDestroy() {
    if(this.clickEventSubscription) this.clickEventSubscription.unsubscribe();
  }
  
  ngOnInit(): void {
    // super.ngOnInit()
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
      this.spotservice.getSpotView(this.route.snapshot.params['id']).then((docSnap) => {
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

  getTypes(){
    this.receiveData.getTypes().then( (result: QuerySnapshot) => {
      result.forEach( (res:QueryDocumentSnapshot) =>{
        this.dataTypes.push(res.data());
      });
      this.data.types.forEach( (type:any) => {
        const index = this.dataTypes.findIndex( (e: any) => {return e.name === type});
        if(index === -1) this.dataTypes.push({name: type, status: false})
      });
    }).catch( err => {
      //console.log(err);
      this.sharedService.notify("Failed to get types, try again later!", 4000)
    });
  }

  getConditions(){
    this.receiveData.getConditions().then( (result: QuerySnapshot) => {
      result.forEach( (res:QueryDocumentSnapshot) =>{
        this.dataConditions.push(res.data());
      });

      if(this.data.conditions) {
        const index = this.dataConditions.findIndex( (e: any) => {return e.name === this.data.conditions});
        if(index === -1) this.dataConditions.push({name: this.data.conditions, status: false})
      }

    }).catch( err => {
      //console.log(err);
      this.sharedService.notify("Failed to get conditions, try again later!", 4000)
    });
  }

  selectFiles(event: any): void {
    let notAddImgs:number = 0;
    this.selectedFiles = [];
    for (let index = 0; index < event.target.files.length; index++) {
      if(this.selectedFiles.length < (this.maxImgs - this.dataPictures.length)){
        this.selectedFiles.push(event.target.files[index])
      }else{
        notAddImgs++
      }
    }
    
    if (this.selectedFiles && this.selectedFiles[0]) {
      this.disabled = true;
      //let previews: any[] = [];
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
          let cover: boolean = false; 
          if(this.dataPictures.length == 0 && i == 0) cover = true;
          // this.compressImage(e.target.result, 600, 400).then(compressed => {
          this.updatePictures(name, e.target.result, orientation, i+1 == numberOfFiles ? true : false, cover);
          // })
        };
      }
    }

    if(notAddImgs > 0){
      this._snackBar.open(notAddImgs + " Images were not inserted", undefined, {
        duration: 2000,
        })
    }
    (<HTMLInputElement>document.getElementById("fileInput")).value = '';
  }

  remove(index:any){
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
        this.spotservice.deleteImage(this.dataPictures[index].path).then( (response) => {
          this.spotservice.updateSpot(this.resourceForm.get('uid')?.value, { pictures: arrayRemove(this.dataPictures[index])}).then((responsePic) => {
            let imageCover = this.dataPictures[index].cover;
            this.dataPictures.splice(index,1);
            if(imageCover === true){
              this.sharedService.notify("Picture deleted successfully, setting new cover !", 4000);
              this.setCover(0);
            }else{
              this.disabled = false;
              this.sharedService.notify("Picture deleted successfully !", 4000);
            }
            
          }).catch( (error)=>{
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
  }

  updateThumbnail(name:string, file:any, orientation: DOC_ORIENTATION, cover_index: number){
    this.disabled = true;
    let path = "spots/"+  this.resourceForm.get('uid')?.value +"/"+ name + "_thumbnail.png";
    this.spotservice.uploadImageAsPromise(file, path, orientation, true).then((response) => {
      this.thumbnail = response;
      this.dataPictures.forEach( pictures => {
        if(pictures.cover === true) pictures.cover = false;
      });
      this.dataPictures[cover_index].cover = true;
      this.spotservice.updateSpot(this.resourceForm.get('uid')?.value, {thumbnail: response , pictures: this.dataPictures}).then(() => {
        // , status: 'image modified'
        //this.spotservice.addModeration(this.resourceForm.get('uid')?.value, this.data.name,'image modified');
        this.disabled = false;
        this.sharedService.notify("Thumbnail updated successfully !", 4000);
        
      }).catch( (error)=>{
        this.disabled = false;
        this.sharedService.notify("An error occurred, try again later!", 4000);
        //console.log(error);
      });
    }).catch((error)=> {
      this.disabled = false;
      this.sharedService.notify("An error occurred, try again later!", 4000);
      //console.log(error);
    });
  }

  updatePictures(name:string, file:any, orientation: DOC_ORIENTATION, last:boolean, cover: boolean){
    this.imageCompress
    .compressFile(file, orientation, 60, 45, 1024, 1024)
    .then((result: DataUrl) => {

      let path = "spots/"+  this.resourceForm.get('uid')?.value +"/"+ name + "_"+ Date.now()+".png";
      this.spotservice.uploadImageAsPromise(result, path, orientation, cover).then((response) => {
        this.spotservice.updateSpot(this.resourceForm.get('uid')?.value, { pictures: arrayUnion( response )}).then((responsePic) => {
          if(last == true) {
            this.sendData.addModeration(this.resourceForm.get('uid')?.value, this.data.name,'image modified', this.user.uid, this.resourceForm.get('address.country')?.value, this.user.displayName);
            this.disabled = false;
            this.sharedService.notify("Pictures updated successfully !", 4000);
          }
          this.dataPictures.push(response);
          if(cover) this.setCover(0);
          
        }).catch( (error)=>{
          this.disabled = false;
          this.sharedService.notify("An error occurred, try again lateeer!", 4000);
          console.log(error.message);
        });
      }).catch((error)=> {
        this.disabled = false;
        this.sharedService.notify("An error occurred, try again later!", 4000);
        //console.log(error);
      });
    });
  }

  imageResize(index: number){
    let gallery = (<HTMLDivElement>document.getElementById("gallery-item-"+index));
    gallery.classList.toggle("full");
  }

  async save(){
    //console.log("chegou aqui");
    //console.log(this.dataPictures.length)
    if(this.dataPictures.length > 0 && this.resourceForm.valid){
      // console.log(this.resourceForm)
      //console.log("entrou varias vezes?")
      this.disabled = true;
      //let spot: Spot = this.resourceForm.value;
      //spot['status'] = 'infos modified';
      this.spotservice.updateSpot(this.resourceForm.get('uid')?.value, this.resourceForm.value).then((response) => {
          this.sendData.addModeration(this.resourceForm.get('uid')?.value, this.resourceForm.get('name')?.value,'infos modified', this.user.uid , this.resourceForm.get('address.country')?.value, this.user.displayName);
          this.disabled = false;
          this.sharedService.notify("Spot updated successfully !", 4000);
          //this.clickEventSubscription.unsubscribe();
          this.router.navigate(['/'],{
            state: {
              data: {
                spot_uid: this.resourceForm.get('uid')?.value,
                lat: this.resourceForm.get('lat')?.value,
                lng: this.resourceForm.get('lng')?.value
              }
            }
          });
      }).catch( (error)=>{
        this.disabled = false;
        this.sharedService.notify("An error occurred, try again later!", 4000);
        console.log(error);
      });
    }else{
      this.resourceForm.markAllAsTouched();
      if(this.dataPictures.length == 0){
        this.sharedService.notify("Need at least 1 pictures", 4000);
      }
    }
  }

  setCover(index: any) {
    this.disabled = true;
    const imgUrl = this.dataPictures[index].downloadURL;
    // console.log(imgUrl)
    const imgName = "cover";
    this.httpClient.get(imgUrl, {responseType: 'blob' as 'json'})
      .subscribe((res: any) => {
        const file = new Blob([res], {type: res.type});

        let reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e: any) => {
          //console.log(this.dataPictures[index])
          this.imageCompress
          .compressFile(e.target.result, this.dataPictures[index].orientation, 100, 100, 80, 80)
          .then((result: DataUrl) => {
            if(this.thumbnail == null){
                this.updateThumbnail(imgName, result, this.dataPictures[index].orientation, index);
            } else {
               //* Remover o thumbmail anterior do banco
              this.spotservice.deleteImage(this.thumbnail.path).then( (response) => {
                this.spotservice.updateSpot(this.resourceForm.get('uid')?.value, {thumbnail: null}).then((responseThumbnail) => {
                  this.thumbnail = null;
                  this.disabled = false;
                  this.updateThumbnail(imgName, result, this.dataPictures[index].orientation, index);
                }).catch((error)=>{
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
      }, err =>{
        //console.log(err);
        this.disabled = false;
        this.sharedService.notify("An error occurred, try again later!", 2000);
      });
  }

    protected buildResourceForm() {
      console.log('ok')
      // this.resourceForm = this.formBuilder.group({
      //     uid: [null, Validators.required],
      //     user_uid: [null, Validators.required],
      //     name: [null,Validators.required],
      //     address: new FormGroup({
      //       city: new FormControl(null, Validators.required),
      //       state: new FormControl(null, Validators.required),
      //       country: new FormControl(null, Validators.required),
      //       point_of_interest: new FormControl(null),
      //       postal_code: new FormControl(null),
      //       route: new FormControl(null, Validators.required),
      //       street_number: new FormControl(null),
      //     }),
      //     types: [null, Validators.required],
      //     conditions: [null, Validators.required],
      //     lat: [null, Validators.required],
      //     lng: [null, Validators.required],
      //     hash: [null, Validators.required]
      //   });
  }

}
