import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-default',
  templateUrl: './default.component.html',
  styleUrls: ['./default.component.scss']
})
export class DefaultComponent implements AfterViewInit {
  

  WIDTH = 640;
  HEIGHT = 480;
  disabled = false;
  loading = false;
  public form!: FormGroup;

  frontStream:any;
  backStream:any;

  streamLive!: any;
  stream: string = "environment";
  currentStream: number = 0;


  @ViewChild("video")
  public video!: ElementRef;

  @ViewChild("canvas")
  public canvas!: ElementRef;

  captures: string[] = [];
  error: any;
  isCaptured!: boolean;
  

  maxImgs: number = 9;
  LastReverseAdress: any;
  address: any;
  latLng:any;

  constructor(private fb: FormBuilder,
    private router: Router,
    private notification: NotificationService
    ){
    this.form = this.fb.group({
      city: [null,Validators.required],
      state: [null,Validators.required],
      country: [null,Validators.required],
      point_of_interest: [null],
      route: [null,Validators.required],
      street_number: [null, Validators.required],
    });
  }
  async ngAfterViewInit() {
    //await this.setupDevices();
  }

  clearForm(){
    this.form = this.fb.group({
      city: [null,Validators.required],
      state: [null,Validators.required],
      country: [null,Validators.required],
      point_of_interest: [null],
      route: [null,Validators.required],
      street_number: [null],
    });
  }

  async setupDevices() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        //const stream = await navigator.mediaDevices.getUserMedia({
        this.streamLive =  await navigator.mediaDevices.getUserMedia({
          //video: true,
          audio: false,
          video: {
            // width: { min: 640, ideal: 1280},
            // height: { min: 480, ideal: 720 },
            facingMode: "environment"
          }
        });
        //console.log(stream)
        if (this.streamLive) {
          this.video.nativeElement.srcObject = this.streamLive;
          this.video.nativeElement.play();
          this.error = null;
        } else {
          //console.log(this.streamLive);
          this.error = "You have no output video device";
        }
      } catch (e) {
        //console.log(e);
        this.error = e;
      }
    }
  }

  compressImage(src:string, newX:number, newY:number) {
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

  newcompressImage(src:string, newX:number, newY:number) {
    var MAX_WIDTH = newX;
    var MAX_HEIGHT = newY;
    return new Promise((res, rej) => {
      const img = new Image();
      img.src = src;
      img.onload = (e:any) => {
        //console.log(e.currentTarget.width)
        var width = img.width;
        var height = img.height;

        // Change the resizing logic
        if (width > height) {
            if (width > MAX_WIDTH) {
                height = height * (MAX_WIDTH / width);
                width = MAX_WIDTH;
            }
        } else {
            if (height > MAX_HEIGHT) {
                width = width * (MAX_HEIGHT / height);
                height = MAX_HEIGHT;
            }
        }
        const elem = document.createElement('canvas');
        elem.width = width;
        elem.height = height;
        const ctx = elem.getContext('2d');
        let data:string = '';
        if(ctx != null){
          ctx.drawImage(img, 0, 0, width, height);
          data = ctx.canvas.toDataURL();
          //console.log(width , height)
        }
        res(data);
      }
      img.onerror = error => rej(error);
    })
  }

  // newCompress(src:any) {
  //   return new Promise((res, rej) => {
  //     const img = new Image();
  //     img.src = src;
  //     img.onload = () => {
  //       const elem = document.createElement('canvas');
  //       elem.width = src.width;
  //       elem.height = newY;
  //       const ctx = elem.getContext('2d');
  //       let data:string = '';
  //       if(ctx != null){
  //         ctx.drawImage(img, 0, 0, newX, newY);
  //         data = ctx.canvas.toDataURL();
  //       }
  //       res(data);
  //     }
  //     img.onerror = error => rej(error);
  //   })
  // }

  newCompressClone(img:any) {
    // const canvas = document.querySelector('canvas');
    // canvas.width = getComputedStyle(canvas).width.split('px')[0];
    // canvas.height = getComputedStyle(canvas).height.split('px')[0];
    // let ratio  = Math.min(canvas.width / img.width, canvas.height / img.height);
    // let x = (canvas.width - img.width * ratio) / 2;
    // let y = (canvas.height - img.height * ratio) / 2;
    // canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    // canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height,
    //     x, y, img.width * ratio, img.height * ratio);
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
      reader.onload = (e: any) => {
        //this.newcompressImage(e.target.result, 1024, 768).then((compressed:any) => {
        this.compressImage(e.target.result, 1024, 768).then((compressed:any) => {
          this.captures.push(compressed)
          // this.previews.push({
          //   name: name,
          //   file: compressed
          // });
        })
      };
    }

    (<HTMLInputElement>document.getElementById("fileInput")).value = '';
  }

  capture() {
    this.disabled = true;
    this.drawImageToCanvas(this.video.nativeElement);
    this.captures.push(this.canvas.nativeElement.toDataURL("image/png"));
    if(this.captures.length == 9){
      this.streamLive.getTracks().forEach((track:any) => track.stop());
      this.streamLive = null;
    }
    setTimeout(() => {
      this.disabled = false;
    }, 200);
    
    //this.isCaptured = true;
  }

  async requestPosition() {
    this.address = null;
    this.clearForm();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {

        // let lat = position.coords.latitude;
        // let lng = position.coords.longitude;

        this.latLng = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }

        this.ReverseGeocodingData(this.latLng.lat, this.latLng.lng);

        
      }, (error) => {
        //console.log(error)
      }, { timeout: 10000 });
    } else {
      // this.getError = "Não possui geolocation";
      // this.notification.notify("Not found Geolocation!", 4000);
    }
  }

  ReverseGeocodingData(lat: number, lng: number) {
    var latlng = new google.maps.LatLng(lat, lng);
    // This is making the Geocode request
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({ 'location': latlng }, (results, status) => {
      if (status !== google.maps.GeocoderStatus.OK) {
        alert(status);
      }
      // This is checking to see if the Geoeode Status is OK before proceeding
      if (status == google.maps.GeocoderStatus.OK) {
        //this.LastReverseAdress = results;
        //this.prepareLocation();
        this.prepareLocation(results);
      }
    });
  }

  getGeoLocation(address: string): Observable<any> {
    //console.log('Getting address: ', address);
    let geocoder = new google.maps.Geocoder();
    return Observable.create((observer:any) => {
        geocoder.geocode({
            'address': address
        }, (results, status) => {
            if (status == google.maps.GeocoderStatus.OK) {
                //observer.next(results[0].geometry.location);
                observer.next(results[0]);
                observer.complete();
            } else {
                //console.log('Error: ', results, ' & Status: ', status);
                observer.error();
            }
        });
    });
}

  prepareLocation(results:any) {
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

    //console.log(adress);

    this.address = adress;
    this.form.patchValue(adress);
    
    // this.router.navigate(['/spot'], {
    //   state: {
    //     data: {
    //       lat: this.rcOptionsTS.lat,
    //       lng: this.rcOptionsTS.lng,
    //       address: adress
    //     }
    //   }
    // });
  }

  SpotSubmit(){
    if(this.form.valid && this.captures.length >= 1){
      this.loading = true;
      const formatted = this.form.get('route')?.value + " " + this.form.get('street_number')?.value + " " + this.form.get('city')?.value + " " + this.form.get('state')?.value + " " + this.form.get('country')?.value;
      //+ " " +
      //  this.form.get('postal_code')?.value;

      //console.log(formatted);
      this.getGeoLocation(formatted).subscribe( res => {
        setTimeout(() => {
          this.loading = false;
          this.router.navigate(['/spot'], {
            state: {
              data: {
                lat: res.geometry.location.lat(),
                lng: res.geometry.location.lng(),
                address: this.form.value,
                images: this.captures
              }
            }
          });
        }, 1000);
        
        //console.log(this.form.value)
        //console.log(res.geometry.location.lat())
        //console.log(res.geometry.location.lng())
        
      }, err => {
        this.loading = false;
        //console.log(err)
      });
      
    }else{
      this.form.markAllAsTouched();

      if(this.captures.length == 0){
        this.notification.notify("Need at least 1 picture!", 3000)
      }
    }
  }

  // removeCurrent() {
  //   this.isCaptured = false;
  // }

  // setPhoto(idx: number) {
  //   this.isCaptured = true;
  //   var image = new Image();
  //   image.src = this.captures[idx];
  //   this.drawImageToCanvas(image);
  // }

  drawImageToCanvas(image: any) {
    this.canvas.nativeElement
      .getContext("2d")
      .drawImage(image, 0, 0, this.WIDTH, this.HEIGHT);
  }

  async changeCam(){
    let flip_cam = (<HTMLDivElement>document.getElementById("flip_cam"));
    flip_cam.classList.toggle("down");
    if(this.stream == 'user'){
      this.stream = "environment";
    }else{
      this.stream = 'user';
    }
    this.video.nativeElement.pause();
    this.video.nativeElement.srcObject = null;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          //video: true,
          audio: false,
          video: {
            facingMode: this.stream
          }
        });
        //console.log(stream)
        if (stream) {
          
          this.video.nativeElement.srcObject = stream;
          this.video.nativeElement.play();
          this.error = null;
        } else {
          //console.log(stream);
          this.error = "You have no output video device";
        }
      } catch (e) {
        //console.log(e);
        //this.error = e;
      }
    }
  }

  async remove(index:any){
    let sum = this.captures.length;
    this.captures.splice(index,1);
    if(sum == 9) {
        try {
          this.streamLive = await navigator.mediaDevices.getUserMedia({
            //video: true,
            audio: false,
            video: {
              // width: { min: 640, ideal: 1280},
              // height: { min: 480, ideal: 720 },
              facingMode: "environment"
            }
          });
          //console.log(stream)
          if (this.streamLive) {
            this.video.nativeElement.srcObject = this.streamLive;
            this.video.nativeElement.play();
            this.error = null;
          } 
        } catch (e) {
          //console.log(e);
          //this.error = e;
        }
    }
  }

  imageResize(index: number){
    let gallery = (<HTMLDivElement>document.getElementById("gallery-item-"+index));
    gallery.classList.toggle("full");
  }

}
