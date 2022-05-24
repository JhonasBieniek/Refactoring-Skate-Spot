import { receiveData } from '../../pages/spot/shared/services/receiveData.service';
import { Spot } from '../../pages/spot/shared/models/spot.model';
import { MapInfoWindow, GoogleMap, MapMarker } from '@angular/google-maps';
import { ViewChild, ViewChildren, ElementRef, Injectable, QueryList } from '@angular/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { conditions } from '../../pages/base/base/base.component';
import { HttpClient } from '@angular/common/http';
import { SharedService } from './shared.service';
import { Platform } from '@angular/cdk/platform';
import { SpotService } from '../../pages/spot/shared/services/spot.service';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from './auth.service';
import { NavbarService } from './navbar.service';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MapsAPILoader } from '@agm/core';
import { Title } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';

@Injectable({
    providedIn: 'root'
})

export class InitializeAndPosition{
    @ViewChild(MapInfoWindow, { static: false }) info!: MapInfoWindow;
    @ViewChild(GoogleMap, { static: false }) map!: GoogleMap;
    @ViewChildren(MapMarker) myMarkers!: QueryList<google.maps.Marker>;
    @ViewChild('searchInput') searchElementRef!: ElementRef;
    myStyles: google.maps.MapTypeStyle[] = [];
  
    zoom = 22;
    conditions: conditions[] = []
  
    LastReverseAdress: any;
    infoContent: any = null;
    rcOptionsTS = {
      display: 'none',
      top: '0px',
      left: '0px',
      lat: 0,
      lng: 0,
      address: ''
    }
    apiLoaded!: Observable<boolean>;
    form!: FormGroup;
    center!: google.maps.LatLngLiteral;
    vertices: google.maps.LatLngLiteral[] = [];
    autocompleteService!: google.maps.places.AutocompleteService;
    mapOptions: google.maps.MapOptions = {
      clickableIcons: false,
      mapTypeId: 'terrain',
      minZoom: 3,
      maxZoom: 19,
      disableDefaultUI: true,
      styles: this.myStyles
    };
    PolygonOptions: google.maps.PolygonOptions = {
      clickable: false,
      strokeOpacity: 0.2
    };
    markers: any[] = [];
    getError: string = '';
    showAdvanced: boolean = false;
    showSearch: boolean = false;
  
    search$: Subject<string> = new Subject();
    spots$: any[] = [];
    spots: any[] = [];
    requestingPosition: boolean = false;
    disabled: boolean = false;
    location: boolean = false;
  
    searching: boolean = false;
    searchResult: google.maps.places.QueryAutocompletePrediction[] = [];
    requestBoundEvent!: Subscription;
    watchPosition_id!: number;
    searchSpot: boolean = false;

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
        
    }

    async requestPosition() {
        this.showAdvanced = false;
        this.spots$ = [];
        if (navigator.geolocation) {
          this.disabled = true;
          let checkWatch = this.watchPosition_id ? true : false;
          if (checkWatch) navigator.geolocation.clearWatch(this.watchPosition_id);
          navigator.geolocation.getCurrentPosition(async (position) => {
            this.disabled = false;
            let lat = position.coords.latitude;
            let lng = position.coords.longitude;
            this.markers = [];
            let response = await this.spotService.getAllMapSpots();
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
            //* Verifica se é retorno de alguem spot criado para setar o center;
            if (history.state.data != undefined) {
              this.center = {
                lat: history.state.data.lat,
                lng: history.state.data.lng,
              }
            } else {
              this.center = {
                lat: lat,
                lng: lng,
              }
            }
            this.getError = '';
            if (checkWatch) this.watchPostion();
          }, (error) => {
            this.getError = error.message;
            //.log(error);
            this.disabled = false;
            this.sharedService.notify(error.message, 2000);
          }, { timeout: 10000 });
        } else {
          this.getError = "Não possui geolocation";
          this.sharedService.notify("Not found Geolocation!", 4000);
        }
      }

    //* Monitorar Posição
    watchPostion() {
        let checkWatch = this.navbarService.readWatchPositionID() > 0 ? true : false;
        if (checkWatch) navigator.geolocation.clearWatch(this.navbarService.readWatchPositionID());
        this.navbarService.nextWatchPositionID(navigator.geolocation.watchPosition((position) => {
        this.addMarker(position.coords.latitude, position.coords.longitude);
        }, (error) => {
        navigator.geolocation.clearWatch(this.watchPosition_id)
        console.log(error);
        }))
        this.watchPosition_id = this.navbarService.readWatchPositionID();
    }
    //* fim do monitoramento

    async startMaps() {
        this.spots$ = [];
        this.spots = [];
        if (navigator.geolocation) {
          this.disabled = true;
          let checkWatch = this.navbarService.readWatchPositionID() > 0 ? true : false;
          if (checkWatch) navigator.geolocation.clearWatch(this.watchPosition_id)
          // console.log(this.watchPosition_id);
          navigator.geolocation.getCurrentPosition(async (position) => {
            this.requestBoundEvent = this.sharedService.getMapRequestView().subscribe(() => {
              this.getViewCenter();
            });
            this.disabled = false;
            let lat = position.coords.latitude;
            let lng = position.coords.longitude;
    
            this.markers = [];
            this.spots = await this.spotService.getAllMapSpots();
    
            this.spots.forEach((spot: Spot) => {
              this.markers.push({
                position: {
                  lat: spot.lat,
                  lng: spot.lng
                },
                info: spot,
                title: spot.name,
              })
            });
            //* Verifica se é retorno de alguem spot criado para setar o center;
            if (history.state.data != undefined) {
              if (history.state.data.lat && history.state.data.lng) {
                this.center = {
                  lat: history.state.data.lat,
                  lng: history.state.data.lng,
                }
                setTimeout(() => {
                  this.myMarkers.forEach((result: any) => {
                    const mark = result.getPosition()?.toJSON();
                    if (mark?.lat === history.state.data.lat && mark?.lng === history.state.data.lng) {
                      let spot = this.spots.find(spot => spot.uid === history.state.data.spot_uid)
                      this.infoContent = spot;
                      var latlng = new google.maps.LatLng(spot.lat, spot.lng);
                      var bounds = new google.maps.LatLngBounds();
                      bounds.extend(latlng)
                      this.map.fitBounds(bounds);
                      this.info.open(result)
                    }
                  })
                }, 1000);
              } if (history.state.data.bounds) {
                //console.log(history.state.data)
                this.center = history.state.data.latLng;
                //console.log(this.map)
                setTimeout(() => {
                  if (this.map) {
                    this.map.fitBounds(history.state.data.bounds, 0);
                  }
                }, 1000);
              } else {
                this.center = {
                  lat: lat,
                  lng: lng,
                }
              }
            } else {
              this.center = {
                lat: lat,
                lng: lng,
              };
              let spot_uid: any = null;
              this.route.queryParams.subscribe(params => {
                if (params['spot']) {
                  spot_uid = params['spot'];
                }
              });
              if (spot_uid != null) {
                setTimeout(() => {
                  let index = this.spots.findIndex(spot => spot.uid == spot_uid);
                  if (index) {
                    this.myMarkers.forEach((result: any) => {
                      if (result._position.lat == this.spots[index].lat && result._position.lng == this.spots[index].lng) {
                        this.spots$ = [];
                        this.searchResult = [];
                        this.infoContent = this.spots[index];
                        var latlng = new google.maps.LatLng(this.spots[index].lat, this.spots[index].lng);
                        var bounds = new google.maps.LatLngBounds();
                        bounds.extend(latlng)
                        //this.map.panTo(latlng);
                        this.center = {
                          lat: this.spots[index].lat,
                          lng: this.spots[index].lng,
                        }
                        this.map.fitBounds(bounds);
                        this.info.open(result)
                      }
                    })
                  }
                }, 1000);
              } else {
                if (this.sharedService.getLastBounds()) {
                  this.center = this.sharedService.getLastLatLng().toJSON();
                  //console.log(this.map)
                  setTimeout(() => {
                    if (this.map) {
                      this.map.fitBounds(this.sharedService.getLastBounds().toJSON(), 0);
                    }
                  }, 1000);
                }
              }
            }
            this.getError = '';
            this.watchPostion();
          }, (error) => {
            this.getError = error.message;
            console.log(error.message);
            this.disabled = false;
            this.sharedService.notify(error.message, 2000);
          }, { timeout: 10000 });
        } else {
          this.getError = "Não possui geolocation";
          this.sharedService.notify("Not found Geolocation!", 2000);
        }
      }

    getViewCenter() {
        if (!this.map.getBounds()?.isEmpty()) {
            const bound = this.map.getBounds();
            const center = this.map.getCenter();
            if (bound) this.sharedService.saveLastBounds(bound, center);
        }
      }
    
    addMarker(lat: number, lng: number) {
        let index = this.markers.findIndex(mark => { return mark.current == "My Position"; });
        if (index >= 0) {
        this.markers[index].position = {
            lat: lat,
            lng: lng,
        };
        } else {
            this.markers.push({
                position: {
                lat: lat,
                lng: lng,
                },
                current: 'My Position',
                title: 'My Position',
                options: { icon: './assets/icons/skateboard-icon.png' },
            })
        }
    }
}