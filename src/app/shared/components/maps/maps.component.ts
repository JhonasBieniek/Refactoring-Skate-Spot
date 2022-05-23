import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';

@Component({
  selector: 'app-maps',
  templateUrl: './maps.component.html',
  styleUrls: ['./maps.component.scss']
})
export class MapsComponent implements OnInit {

  apiLoaded: Observable<boolean>;
  center!: google.maps.LatLngLiteral;
  mapOptions: google.maps.MapOptions = {
    mapTypeId: 'terrain',
    minZoom: 8,
    zoomControl: false,
    disableDefaultUI: true
  }
  markers: any[] = [];
  getError:string = '';

  constructor(httpClient: HttpClient) {
    this.apiLoaded = httpClient.jsonp('https://maps.googleapis.com/maps/api/js?key=AIzaSyACmzpmAsMKnFJZJUou8bQPyCEQ13kGIl8', 'callback')
      .pipe(
        map(() => {
          this.requestPositionAtual();
          return true;
        }),
        catchError(() => of(false)),
      );
  }

  ngOnInit() {
  }

  requestPosition(){
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.center = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        this.markers[0].position = {
          lat: position.coords.latitude ,
          lng: position.coords.longitude,
        }
        this.getError = '';
      },(error) => {
        this.getError = error.message;
        //console.log(error);
      },{timeout:10000});
    }else{
      this.getError = "Não possui geolocation";
      //console.log("Não possui geolocation");
    }
  }

  requestPositionAtual(){
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.center = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        this.addMarker(position.coords.latitude,position.coords.longitude);
        //this.watchPostion();
        this.getError = '';
      },(error) => {
        this.getError = error.message;
        //console.log(error);
      },{timeout:10000});
    }else{
      this.getError = "Não possui geolocation";
      //console.log("Não possui geolocation");
    }
  }

  watchPostion(){
    navigator.geolocation.watchPosition((position) => {
      this.center = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      }
      this.markers[0].position = {
        lat: position.coords.latitude ,
        lng: position.coords.longitude,
      }
    })
  }

  addMarker(lat:number,lng:number) {
    this.markers.push({
      position: {
        lat: lat ,
        lng: lng,
      },
      /*label: {
        color: 'white',
        //text: 'Position',
      },*/
      
      title: 'Position',
      options: { animation: google.maps.Animation.BOUNCE, icon:'./assets/icons/skateboard-icon.png' },
    })
  }

}
