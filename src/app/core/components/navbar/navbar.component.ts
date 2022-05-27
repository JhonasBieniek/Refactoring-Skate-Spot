import { NumberSymbol } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Router, RouterLinkActive } from '@angular/router';
import { DataUrl, DOC_ORIENTATION, NgxImageCompressService } from 'ngx-image-compress';
import { AuthService } from '../../../shared/services/auth.service';
import { SharedService } from '../../../shared/services/shared.service';
import { SigninComponent } from '../signin/signin.component';
import { NavbarService } from '../../../shared/services/navbar.service';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { SpotService } from '../../../pages/spot/shared/services/spot.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {

  user: any;
  camRequest = {
    lat: 0,
    lng: 0,
    address: {}
  }

  clickEvent: boolean = false;
  showSearch: boolean = false;
  showDesktopIcon: boolean = false;
  watchPosition_id!: number;
  
  constructor(
    public breakpointObserver: BreakpointObserver,
    public authService: AuthService,
    public navbarService: NavbarService,
    private _bottomSheet: MatBottomSheet,
    private dialog: MatDialog,
    public navRouter: Router,
    public sharedService: SharedService,
    private imageCompress: NgxImageCompressService,
    public spotService : SpotService
  ) {
    //console.log(this.navRouter.url === '/login')
  }
  ngOnInit(): void {
    this.breakpointObserver
    .observe(['(min-width: 767px)'])
    .subscribe((state: BreakpointState) => {
      if (state.matches) {
        this.showDesktopIcon = true;
      } else {
        this.showDesktopIcon = false;
      }
    });
    this.authService.getUser()
  }

  public isMenuOpen: boolean = false;
  public isDesktopMenuOpen: boolean = false;


  public onSidenavClick(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  public onDesktopMenu(): void {
    this.isDesktopMenuOpen = !this.isDesktopMenuOpen;
  }

  openBottomSheet(): void {
    let dialogConfig = new MatDialogConfig();
        dialogConfig = {
          maxWidth: '100vw',
          maxHeight: '100vh',
          width: '450px',
        }
        let dialogRef = this.dialog.open(
          SigninComponent,
          dialogConfig,
        );
    //this._bottomSheet.open(SigninComponent);
  }

  openCam(){
    let inputCam = document.getElementById('fileCamInput');
    inputCam?.click()
  }

  setFunctionLogin(){
    if(this.authService.getAuthUser() === null){
      localStorage.setItem('functionLogin', 'profile');
    }
  }

  selectFiles(event: any): void {
    const selectedFile = event.target.files || event.srcElement.files;
    if (selectedFile !== null && selectedFile !== '' && selectedFile.length > 0) {
      const oFile = selectedFile[0];
      const fileName = oFile.name;
      const fileExtension = oFile.name.split('.').pop().toLowerCase();
      //console.log(fileName);
      //console.log(fileExtension);

      let reader = new FileReader();
      reader.readAsDataURL(oFile);
      reader.onload = async (e: any) => {
        let orientation = await this.imageCompress.getOrientation(oFile);
        
        this.ngxCompress(e.target.result,fileName, orientation);
        //this.newcompressImage(e.target.result, 1024, 768).then((compressed:any) => {
        // this.camCompressImage(e.target.result, 1024, 768).then((compressed:any) => {
        //   this.requestPosition(compressed);
        //   //this.captures.push(compressed)
        //   // this.previews.push({
        //   //   name: name,
        //   //   file: compressed
        //   // });
        // })
      };
    }

    (<HTMLInputElement>document.getElementById("fileInputNavbar")).value = '';
  }

  camCompressImage(src:string, newX:number, newY:number) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.src = src;
      img.onload = (e:any) => {
        //console.log(e.currentTarget.width)
        //let ratio  = Math.min(canvas.width / img.width, canvas.height / img.height);
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

  ngxCompress(image:string, name:string, orientation: DOC_ORIENTATION){
    this.imageCompress
    .compressFile(image, orientation, 60, 45, 1024, 1024)
    .then((result: DataUrl) => {
      this.requestPosition({
        name: name,
        file: result,
        orientation: orientation,
        cover: true
      });
        // this.previews.push({
        //   name: name,
        //   file: result,
        //   orientation: orientation,
        //   cover: this.previews.length == 0 ? true : false
        // });
    });
  }

  async requestPosition(image:any) {
    this.camRequest = {
      lat: 0,
      lng: 0,
      address: {}
    };
    
    if (navigator.geolocation) {
      let checkWatch = this.navbarService.readWatchPositionID() >= 0 ? true : false;
      if(checkWatch) navigator.geolocation.clearWatch(this.navbarService.readWatchPositionID());
      navigator.geolocation.getCurrentPosition(async (position) => {
        //console.log(position.coords)
        this.ReverseGeocodingData(position.coords.latitude, position.coords.longitude, image);
        // if(checkWatch){
        //     this.watchPosition_id = navigator.geolocation.watchPosition((position) => {
        //     this.navbarService.nextWatchPositionID(this.watchPosition_id)
        //   });
        // }
      }, (error) => {
        console.log(error)
        this.sharedService.notify(error.message, 2000);
      }, { timeout: 10000 });
    } else {
      // this.getError = "Não possui geolocation";
      this.sharedService.notify("Not found Geolocation!", 2000);
    }
  }

  ReverseGeocodingData(lat: number, lng: NumberSymbol, image:any) {
    var latlng = new google.maps.LatLng(lat, lng);
    // This is making the Geocode request
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({ 'location': latlng }, (results, status) => {
      //console.log(results)
      if (status !== google.maps.GeocoderStatus.OK) {
        alert(status);
      }
      // This is checking to see if the Geoeode Status is OK before proceeding
      if (status == google.maps.GeocoderStatus.OK) {
        this.prepareLocation(results, lat, lng, image);
      }
    });
  }

  prepareLocation(results:any, lat:number, lng: number, image: any) {
    let adress = {
      street_number: '',
      route: '',
      point_of_interest: '',
      //postal_code: '',
      city: '',
      state: '',
      country: '',
    }
    //for (var value of this.LastReverseAdress) {
    for (var value of results) {
      let index = value.types.findIndex((type:any) => {return type == "plus_code" });
      //console.log(value)
      if(index === -1){
        value.address_components.forEach((component:any) => {
          if(adress.country == ''){
            if(component.types.findIndex((type: any) => { return type == 'street_number'}) >= 0 ) adress.street_number = component.long_name;
            if(component.types.findIndex((type: any) => { return type == 'route'}) >= 0) adress.route = component.long_name;
            if(component.types.findIndex((type: any) => { return (type == 'establishment' || type == 'point_of_interest') }) >= 0) adress.point_of_interest = component.long_name;
            //if(component.types.findIndex((type: any) => { return type == 'postal_code'}) >= 0) adress.postal_code = component.long_name;
            if(component.types.findIndex((type: any) => { return type == 'administrative_area_level_2'}) >= 0) adress.city = component.long_name;
            if(component.types.findIndex((type: any) => { return type == 'administrative_area_level_1'}) >= 0) adress.state = component.long_name;
            if(component.types.findIndex((type: any) => { return type == 'country'}) >= 0) adress.country = component.long_name;
          }else{
            if(adress.route == ''){
              if(component.types.findIndex((type: any) => { return type == 'route'}) >= 0) adress.route = component.long_name;
            }
          }
        });
      };
      if(adress.country != '' && adress.route != '') break;
    }

    if(this.authService.user?.uid){
      this.navRouter.navigate(['/spot'], {
        state: {
          data: {
            lat: lat,
            lng: lng,
            address: adress,
            image: image
          }
        }
      });
    }else{

      let dialogConfig = new MatDialogConfig();
      dialogConfig = {
        maxWidth: '100vw',
        maxHeight: '100vh',
        width: '450px',
      }
      let dialogRef = this.dialog.open(
        SigninComponent,
        dialogConfig,
      );

      dialogRef.afterClosed().subscribe(result => {
        let user =  this.authService.getUser();
        if(user != null){
          this.navRouter.navigate(['/spot'], {
            state: {
              data: {
                lat: lat,
                lng: lng,
                address: adress,
                image: image
              }
            }
          });
        }
      });

    }
  }

  checkUrl(url:string){
    return this.navRouter.url.includes(url);
  }

  showSearchBar(): void{
    this.showSearch = !this.showSearch;
    this.navbarService.toggleSearchBar()
  }

  showSearchIcon(): boolean{
    return this.checkUrl('/spot') ? false : true
  }

  get_title():string{
    if(this.navRouter.url == '/spot'){
      return "Spot Registration";
    }else if(this.navRouter.url.includes("/spot/view/")){
      return "Spot View";
    }else if(this.navRouter.url.includes("/spot/edit/")){
      return "Spot Edit";
    }else if(this.navRouter.url.includes("/skater")){
      return "Skater View";
    }else{
      return '';
    }
  }

  verifyUrl(): boolean{
    if(this.navRouter.url.includes("/spot/edit/")){
      return true;
    } else if(this.navRouter.url === "/spot"){
      return true;
    } else {
      return false;
    }
  }

   save(event: MouseEvent){
    event.stopPropagation();
    this.clickEvent = true;
    this.sharedService.sendClickEvent();
    setTimeout(() => {
      this.clickEvent = false;
    }, 500);
  }

  requestViewBounds(){
    if(this.navRouter.url === '/'){
      this.sharedService.sendMapRequestView();
    }
  }

  backPreviousUrl(){
    let previousUrl = this.sharedService.getPreviousUrl();
    if(previousUrl === undefined){
      this.navRouter.navigate(['/'])
    } else {
      this.navRouter.navigate([previousUrl])
    }
  }

  spotEdit(){
    this.navRouter.navigate(['/spot/edit', this.sharedService.currentSpot_uid]);
  }
}
