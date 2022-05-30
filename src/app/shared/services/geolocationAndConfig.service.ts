import { receiveData } from '../../pages/spot/shared/services/receiveData.service';
import { InitializeAndPosition } from './startAndPosition.service';
import { QueryDocumentSnapshot, QuerySnapshot } from 'firebase/firestore';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { MapsAPILoader } from '@agm/core';
import { SigninComponent } from '../../core/components/signin/signin.component';
import { Spot } from '../../pages/spot/shared/models/spot.model';
import { SharedService } from './shared.service';
import { Platform } from '@angular/cdk/platform';
import { SpotService } from '../../pages/spot/shared/services/spot.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { AuthService } from './auth.service';
import { FormBuilder } from '@angular/forms';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { NavbarService } from './navbar.service';

@Injectable({
  providedIn: 'root'
})
export class GeolocationAndConfig extends InitializeAndPosition{
    constructor(
        protected fb: FormBuilder,
        protected router: Router,
        protected title: Title,
        protected receiveData: receiveData,
        protected mapsAPILoader: MapsAPILoader,
        protected breakpointObserver: BreakpointObserver,
        protected navbarService: NavbarService,
        protected authService: AuthService,
        protected dialog: MatDialog,
        protected spotService: SpotService,
        protected platform: Platform,
        protected sharedService: SharedService,
        protected route: ActivatedRoute,
        protected http: HttpClient
    ){
      super(fb, router, title, receiveData, mapsAPILoader, breakpointObserver, navbarService, authService, dialog, spotService, platform, sharedService, route, http)
    }

      getGeoLocation(address: string): Observable<any> {
        let geocoder = new google.maps.Geocoder();
        return Observable.create((observer: any) => {
          geocoder.geocode({
            'address': address
          }, (results, status) => {
            if (status == google.maps.GeocoderStatus.OK) {
              observer.next(results[0]);
              observer.complete();
            } else {
              observer.error();
            }
          });
        });
      }

    async upgradeSpotsByDistance() {
        this.markers = [];
        let response = await this.spotService.getSpots(this.center.lat, this.center.lng, this.form.controls['kmDistance'].value, this.showAdvanced, this.conditions);
        response.forEach((spot: Spot) => {
          this.markers.push({
            position: {
              lat: spot.lat,
              lng: spot.lng
            },
            info: spot,
            title: spot.name,
          })
        })
      }

  getReverseGeocodingData(form: string) {
    var latlng = new google.maps.LatLng(this.center.lat, this.center.lng);
    // This is making the Geocode request
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({ 'location': latlng }, (results, status) => {
      if (status !== google.maps.GeocoderStatus.OK) {
        alert(status);
      }
      // This is checking to see if the Geoeode Status is OK before proceeding
      if (status == google.maps.GeocoderStatus.OK) {
        this.form.get(form)?.setValue(results[0].formatted_address);
      }
    });
  }

  reverseLocation() {
    let start = this.form.get('search')?.value;
    let end = this.form.get('end_location')?.value;

    this.form.get('search')?.setValue(end);
    this.form.get('end_location')?.setValue(start);
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
        this.rcOptionsTS.lat = lat;
        this.rcOptionsTS.lng = lng;
        this.infoContent = null;
        this.info.position = latlng;
        this.info.open();
        this.LastReverseAdress = results;
        var bounds = new google.maps.LatLngBounds();
        bounds.extend(latlng)
        this.map.fitBounds(bounds);
      }
    });
  }

  rcOptionsDiv(x: any, y: any) {
    this.info.open();
    this.infoContent = null
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
  }

  getTypes() {
    this.receiveData.getTypes().then((result: QuerySnapshot) => {
      result.forEach((res: QueryDocumentSnapshot) => {
        let type = res.data();
        this.conditions.push({
          name: type.name,
          selected: false
        })
      });
    }).catch(err => {
      console.log(err);
      this.sharedService.notify("Failed to get types, try again later!", 1000)
    });
  }

}