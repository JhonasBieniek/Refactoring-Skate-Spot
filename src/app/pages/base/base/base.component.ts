import { AfterViewInit, Component, ElementRef, NgZone, OnInit, QueryList, ViewChild, ViewChildren, ViewEncapsulation } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';
import { } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup } from '@angular/forms';
import { SigninComponent } from 'src/app/core/components/signin/signin.component';
import { AuthService } from 'src/app/core/services/auth.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { GoogleMap, MapInfoWindow, MapMarker } from '@angular/google-maps';
import { SpotService } from 'src/app/pages/spot/shared/spot.service';
import { Spot } from 'src/app/pages/spot/shared/models/spot.model';
import { Title } from '@angular/platform-browser';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { Platform } from '@angular/cdk/platform';
import { debounceTime } from 'rxjs/operators';
import { MapsAPILoader } from '@agm/core';
import { TypesService } from 'src/app/shared/services/types.service';
import { QueryDocumentSnapshot, QuerySnapshot } from 'firebase/firestore';
import { SharedService } from 'src/app/core/services/shared.service';
import { NavbarService } from 'src/app/shared/services/navbar.service';

import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';

export interface conditions {
  name: string,
  selected: boolean
}

@Component({
  selector: 'app-base',
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class BaseComponent implements OnInit {
  @ViewChild(MapInfoWindow, { static: false }) info!: MapInfoWindow;
  @ViewChild(GoogleMap, { static: false }) map!: GoogleMap;
  @ViewChildren(MapMarker) myMarkers!: QueryList<google.maps.Marker>;
  @ViewChild('searchInput') searchElementRef!: ElementRef;
  myStyles: google.maps.MapTypeStyle[] = [
    // {
    //   featureType: "poi",
    //   elementType: "labels",
    //   stylers: [
    //     { visibility: "off" }
    //   ]
    // }
  ];

  zoom = 22;
  // zoom = 16;
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
    // minZoom: 8,
    // maxZoom: 17,
    //zoomControl: false,
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
    public breakpointObserver: BreakpointObserver,
    private httpClient: HttpClient,
    public navbarService: NavbarService,
    private fb: FormBuilder,
    public authService: AuthService,
    private dialog: MatDialog,
    private router: Router,
    private spotService: SpotService,
    private title: Title,
    private notification: NotificationService,
    public platform: Platform,
    private mapsAPILoader: MapsAPILoader,
    private ngZone: NgZone,
    private typesService: TypesService,
    private sharedService: SharedService,
    private route: ActivatedRoute) {
    this.getTypes();
  }


  ngOnDestroy() {
    if (this.requestBoundEvent) this.requestBoundEvent.unsubscribe();
    if (this.watchPosition_id) navigator.geolocation.clearWatch(this.watchPosition_id);

  }

  ngOnInit(): void {
    this.breakpointObserver
      .observe(['(min-width: 767px)'])
      .subscribe((state: BreakpointState) => {
        if (state.matches) {
          this.showSearch = false;
        } else {
          this.showSearch = true;
        }
      });

    this.title.setTitle("SkateBoardOnly")
    this.form = this.fb.group({
      search: [null],
      end_location: [null],
      kmDistance: [15]
    });

    this.mapsAPILoader.load().then(() => {
      // this.requestPosition();
      this.startMaps();
      // this.watchPostion();
      this.autocompleteService = new google.maps.places.AutocompleteService();

    });

    this.search$
      .pipe(debounceTime(400))
      .subscribe(async (term) => {
        this.searchResult = [];
        this.spots$ = [];
        term = term.toLowerCase().trim();

        if (term) {
          // if (this.showAdvanced) {
          //   if (this.location) {
          //     this.searching = true;
          //     this.autocompleteService.getQueryPredictions({ input: term }, (result) => {
          //       console.log(result);
          //       for (let i = 0; i < 3; i++) {
          //         this.searchResult.push(result[i]);
          //       }
          //       this.searchResult = result;
          //       if(result.length > 0){
          //         this.getGeoLocation(result[0].description).subscribe(async (res: google.maps.GeocoderResult) => {
          //           console.log(res)
          //           if(res.geometry.bounds){
          //             const viewport = res.geometry.viewport.toJSON();
          //             this.map.fitBounds(res.geometry.viewport);
          //             this.vertices = [
          //               {lat: viewport.north, lng: viewport.west},
          //               {lat: viewport.north, lng: viewport.east},
          //               {lat: viewport.south, lng: viewport.east},
          //               {lat: viewport.south, lng: viewport.west},
          //             ];
          //           }else{
          //             this.vertices = [];
          //           }


          //           // var teste = new google.maps.Polygon({
          //           //   paths: res.geometry.bounds
          //           // })
          //           //this.spots$ = await this.spotService.getSpots(res.geometry.location.lat(), res.geometry.location.lng(), this.form.controls['kmDistance'].value, this.showAdvanced, this.conditions);
          //           this.spots$ = await this.spotService.getSpots(res.geometry.location.lat(), res.geometry.location.lng(), this.form.controls['kmDistance'].value, this.showAdvanced, this.conditions);
          //           this.searching = false;
          //         }, err => {
          //           console.log(err)
          //         });
          //       }
          //     });
          //   } else {
          //     this.searching = true;
          //     let spots = await this.spotService.getSpots(this.center.lat, this.center.lng, this.form.controls['kmDistance'].value, this.showAdvanced, this.conditions);
          //     let spotsfiltred: any[] = [];
          //     spots.forEach((element: any) => {
          //       if (element.name.toLowerCase().indexOf(term.toLowerCase()) !== -1) {
          //         spotsfiltred.push(element)
          //       } else if (element.address.route.toLowerCase().indexOf(term.toLowerCase()) !== -1) {
          //         spotsfiltred.push(element)
          //       }
          //     });
          //     this.spots$ = spotsfiltred;
          //     this.searching = false;
          //   }
          // } else {
          this.searching = true;

          this.autocompleteService.getQueryPredictions({ input: term }, async (result) => {
            //console.log(result);
            if (result) {
              if (result.length > 3) {
                for (let i = 0; i < 3; i++) {
                  this.searchResult.push(result[i]);
                }
              } else {
                this.searchResult = result
              }

              if (result.length > 0) {
                this.getGeoLocation(result[0].description).subscribe(async (res: google.maps.GeocoderResult) => {

                  //* cria o polygono no mapa
                  // console.log(res)
                  // if(res.geometry.bounds){
                  //   const viewport = res.geometry.viewport.toJSON();
                  //   this.map.fitBounds(res.geometry.viewport);
                  //   this.vertices = [
                  //     {lat: viewport.north, lng: viewport.west},
                  //     {lat: viewport.north, lng: viewport.east},
                  //     {lat: viewport.south, lng: viewport.east},
                  //     {lat: viewport.south, lng: viewport.west},
                  //   ];
                  // }else{
                  //   this.vertices = [];
                  // }
                  // var teste = new google.maps.Polygon({
                  //   paths: res.geometry.bounds
                  // })

                  this.spots$ = await this.spotService.getSpots(res.geometry.location.lat(), res.geometry.location.lng(), this.form.controls['kmDistance'].value, true, this.conditions);

                  const spotTerm = this.spots.filter(spot => {
                    const name = spot.name.toLowerCase().includes(term);
                    const spotAdress = spot.address.route.toLowerCase().includes(term);
                    if (this.conditions.every(condition => condition.selected === false)) {
                      if (name == true || spotAdress == true) return spot;
                    } else {
                      const validator = this.conditions.some(condition => {
                        if (condition.selected == true) {
                          return spot.types.includes(condition.name)
                        }
                      });

                      if ((name == true || spotAdress == true) && validator) return spot;
                    }

                  });
                  //const spotTerm = await this.spotService.getAllSpots(term);
                  spotTerm.map((spot) => {
                    let index = this.spots$.findIndex(spotList => { return spotList.uid === spot.uid; });
                    if (index === -1) this.spots$.push(spot);
                  });
                  this.searching = false;
                }, err => {
                  console.log(err)
                });
              } else {
                // this.spots$ = await this.spotService.getAllSpots(term);
                this.spots$ = this.spots.filter(spot => {
                  const name = spot.name.toLowerCase().includes(term);
                  const spotAdress = spot.address.route.toLowerCase().includes(term);
                  if (this.conditions.every(condition => condition.selected === false)) {
                    if (name == true || spotAdress == true) return spot;
                  } else {
                    const validator = this.conditions.some(condition => {
                      if (condition.selected == true) {
                        return spot.types.includes(condition.name)
                      }
                    });

                    if ((name == true || spotAdress == true) && validator) return spot;
                  }

                });
                this.searching = false;
              }

            } else {
              this.spots$ = this.spots.filter(spot => {
                const name = spot.name.toLowerCase().includes(term);
                const spotAdress = spot.address.route.toLowerCase().includes(term);
                if (this.conditions.every(condition => condition.selected === false)) {
                  if (name == true || spotAdress == true) return spot;
                } else {
                  const validator = this.conditions.some(condition => {
                    if (condition.selected == true) {
                      return spot.types.includes(condition.name)
                    }
                  });

                  if ((name == true || spotAdress == true) && validator) return spot;
                }

              });

              this.searching = false;
            }
          })
          //}
        }
      });
  }

  showSearchBar(): boolean {
    return this.navbarService.showSearchBar()
  }

  clearConditions() {
    this.conditions.forEach(condition => {
      condition.selected = false;
    })
    this.changeMarks();
  }

  changeMarks() {
    this.spots$ = [];
    this.markers = [];
    setTimeout(() => {
      if (this.conditions.every(condition => condition.selected === false)) {
        this.spots.map(spot => {
          this.markers.push({
            position: {
              lat: spot.lat,
              lng: spot.lng
            },
            info: spot,
            title: spot.name,
            //options: { animation: google.maps.Animation.BOUNCE, icon: spot.pictures ? spot.pictures[0] : './assets/icons/skateboard-icon.png' },
          });
        })
        this.watchPostion()
      } else {
        this.spots.map(spot => {
          const validator = this.conditions.some(condition => {
            if (condition.selected == true) {
              return spot.types.includes(condition.name)
            }
          });

          if (validator) {
            this.markers.push({
              position: {
                lat: spot.lat,
                lng: spot.lng
              },
              info: spot,
              title: spot.name,
              //options: { animation: google.maps.Animation.BOUNCE, icon: spot.pictures ? spot.pictures[0] : './assets/icons/skateboard-icon.png' },
            });
            this.spots$.push(spot)
          }
        });
        this.watchPostion()

      }
    }, 150);
  }

  getViewCenter() {
    //console.log("entrou");
    // console.log(this.sharedService.getLastBounds())
    // if(this.sharedService.getLastBounds()){
    //   console.log(this.sharedService.getLastBounds().toJSON())
    // }else{
    //   console.log(this.sharedService.getLastBounds(), 'vaziu');
    // }
    // console.log(this.map.center);
    //console.log(this.map.getCenter().toJSON());
    //console.log(this.map.getBounds()?.toJSON());
    if (!this.map.getBounds()?.isEmpty()) {
      const bound = this.map.getBounds();
      const center = this.map.getCenter();
      if (bound) this.sharedService.saveLastBounds(bound, center);
    }
  }

  getTypes() {
    this.typesService.getTypes().then((result: QuerySnapshot) => {
      result.forEach((res: QueryDocumentSnapshot) => {
        let type = res.data();
        this.conditions.push({
          name: type.name,
          selected: false
        })
      });
    }).catch(err => {
      //console.log(err);
      //this.notifications.notify("Failed to get types, try again later!", 1000)
    });
  }

  autoCompleteSelect(value: google.maps.places.QueryAutocompletePrediction) {
    this.getGeoLocation(value.description).subscribe(async (res: google.maps.GeocoderResult) => {
      let politicalCheck = res.types.findIndex(type => { return type === "political" });
      let localityCheck = res.types.findIndex(type => { return type === "locality" });
      //console.log(res)
      if (res.geometry.viewport) {
        const viewport = res.geometry.viewport.toJSON();
        this.map.fitBounds(res.geometry.viewport);
        // if(politicalCheck  && localityCheck ){
        //   // this.vertices = [
        //   //   {lat: viewport.north, lng: viewport.west},
        //   //   {lat: viewport.north, lng: viewport.east},
        //   //   {lat: viewport.south, lng: viewport.east},
        //   //   {lat: viewport.south, lng: viewport.west},
        //   //   {lat: viewport.north, lng: viewport.west},
        //   // ];
        // }else{
        //   this.vertices = [];
        // }
      }
      // else{
      //   this.vertices = [];
      // }

      //this.spots$ = await this.spotService.getSpots(res.geometry.location.lat(), res.geometry.location.lng(), this.form.controls['kmDistance'].value, this.showAdvanced, this.conditions);
      this.clearDivs();
    });
  }

  getGeoLocation(address: string): Observable<any> {
    //console.log('Getting address: ', address);
    let geocoder = new google.maps.Geocoder();
    return Observable.create((observer: any) => {
      geocoder.geocode({
        'address': address
      }, (results, status) => {
        if (status == google.maps.GeocoderStatus.OK) {
          //console.log(results)
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

  clear(form: string) {
    this.spots$ = [];
    this.form.get(form)?.setValue('');
  }

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
            //options: { animation: google.maps.Animation.BOUNCE, icon: spot.pictures ? spot.pictures[0] : './assets/icons/skateboard-icon.png' },
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
        // console.log('tempo expirou')
        this.getError = error.message;
        console.log(error.message);
        this.disabled = false;
        this.notification.notify(error.message, 2000);

      }, { timeout: 10000 });
    } else {
      this.getError = "Não possui geolocation";
      this.notification.notify("Not found Geolocation!", 2000);
    }
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
        // this.markers.push({
        //   position: {
        //     lat: lat,
        //     lng: lng,
        //   },
        //   title: 'My Position',
        //   current: 'My Position',
        //   options: { icon: './assets/icons/skateboard-icon.png' },
        // });

        //let response = await this.spotService.getSpots(lat, lng, this.form.controls['kmDistance'].value, this.showAdvanced, this.conditions); //* OPÇÃO COM FILTRO DE KM
        let response = await this.spotService.getAllMapSpots();


        response.forEach((spot: Spot) => {
          this.markers.push({
            position: {
              lat: spot.lat,
              lng: spot.lng
            },
            info: spot,
            title: spot.name,
            //options: { animation: google.maps.Animation.BOUNCE, icon: spot.pictures ? spot.pictures[0] : './assets/icons/skateboard-icon.png' },
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

          // let index = this.markers.findIndex( mark => {  
          //   return mark.info?.uid == "5ahAYNCYBwSOYelmpMvL"; });
          // console.log(this.markers[index])
          // this.infoContent = this.markers[index].info;
          // this.info.open(this.markers[index])
        }
        //* Final da verificação de retorno de spot criado
        //this.map.fitBounds()
        // console.log(this.searchElementRef)
        // setTimeout(() => {
        //   console.log(this.searchElementRef)
        //   let autocomplete = new google.maps.places.Autocomplete(this.searchElementRef.nativeElement);
        //   let service = new google.maps.places.AutocompleteService();
        //   autocomplete.addListener("place_changed", () => {
        //     this.ngZone.run(() => {

        //       let place: google.maps.places.PlaceResult = autocomplete.getPlace();
        //       console.log(place);
        //       if (place.geometry === undefined || place.geometry === null) {
        //         return;
        //       }

        //       //this.latitude = place.geometry.location.lat();
        //       //this.longitude = place.geometry.location.lng();
        //     });
        //   });
        // }, 500);
        this.getError = '';
        if (checkWatch) this.watchPostion();
      }, (error) => {
        this.getError = error.message;
        //.log(error);
        this.disabled = false;
        this.notification.notify(error.message, 2000);
      }, { timeout: 10000 });
    } else {
      this.getError = "Não possui geolocation";
      this.notification.notify("Not found Geolocation!", 4000);
    }
  }

  /*
  // startSearch() {
  //   setTimeout(() => {
  //     console.log(this.searchElementRef.nativeElement)
  //     const teste = (<HTMLInputElement>document.getElementById("searchInput"))
  //     console.log(teste.autocomplete)
  //   const autocomplete = new google.maps.places.Autocomplete(teste);
  //   console.log(this.searchElementRef)
  //   autocomplete.addListener("place_changed", () => {
  //     this.ngZone.run(() => {

  //       //get the place result
  //       const place: google.maps.places.PlaceResult = autocomplete.getPlace();
  //       console.log(place);
  //       //verify result
  //       if (place.geometry === undefined || place.geometry === null) {
  //         return;
  //       }

  //       //set latitude, longitude and zoom
  //       //this.lat = place.geometry.location.lat();
  //       //this.lng = place.geometry.location.lng();
  //       this.zoom = 12;
  //     }); 
  //   });
  //   }, 2000);
  // }
  */

  requestPositionAtual() {
    if (navigator.geolocation) {
      this.disabled = true;
      let checkWatch = this.watchPosition_id > 0 ? true : false;
      if (checkWatch) navigator.geolocation.clearWatch(this.watchPosition_id);
      navigator.geolocation.getCurrentPosition((position) => {
        this.disabled = false;
        this.center = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        this.getError = '';
        if (checkWatch) this.watchPostion();
      }, (error) => {
        this.disabled = false;
        console.log(error.message)
        this.getError = error.message;
        //console.log(error);
      }, { timeout: 10000 });
    } else {
      this.getError = "Não possui geolocation";
      this.notification.notify("Not found Geolocation!", 2000);
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
        //options: { animation: google.maps.Animation.BOUNCE, icon: './assets/icons/skateboard-icon.png' },
      })
    }

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

  click(event: google.maps.MapMouseEvent) {
    this.form.controls['search'].setValue(null);
    this.showAdvanced = false;
    this.spots$ = [];
    if (this.rcOptionsTS.display == 'none') {
      this.ReverseGeocodingData(event.latLng.lat(), event.latLng.lng());
    } else {
      this.rcOptionsTS.display = 'none';
    }

    //this.rcOptionsDiv(event2.domEvent.x,event2.domEvent.y);
    //console.log(event2);
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
        // let address = results[0].formatted_address.split(',');
        this.LastReverseAdress = results;
        var bounds = new google.maps.LatLngBounds();
        bounds.extend(latlng)
        this.map.fitBounds(bounds);
        //this.rcOptionsTS.address = results[0].address_components[1].long_name + " , " + results[0].address_components[0].long_name;
        //this.rcOptionsDiv(x,y);
      }
    });
  }

  rightClick(event: google.maps.MapMouseEvent) {
    this.showAdvanced = false;
    this.form.controls['search'].setValue(null);
    this.spots$ = [];
    //let event2: any = event;
    if (this.rcOptionsTS.display == 'none') {
      this.ReverseGeocodingData(event.latLng.lat(), event.latLng.lng());
    }
  }

  rcOptionsDiv(x: any, y: any) {

    this.info.open();
    this.infoContent = null
  }

  newSpot() {
    let adress = {
      street_number: '',
      route: '',
      point_of_interest: '',
      postal_code: '',
      city: '',
      state: '',
      country: '',
    }
    for (var value of this.LastReverseAdress) {
      let index = value.types.findIndex((type: any) => { return type == "plus_code" });
      //console.log(value)
      if (index === -1) {
        value.address_components.forEach((component: any) => {
          if (adress.country == '') {
            if (component.types.findIndex((type: any) => { return type == 'street_number' }) >= 0) adress.street_number = component.long_name;
            if (component.types.findIndex((type: any) => { return type == 'route' }) >= 0) adress.route = component.long_name;
            if (component.types.findIndex((type: any) => { return (type == 'establishment' || type == 'point_of_interest') }) >= 0) adress.point_of_interest = component.long_name;
            if (component.types.findIndex((type: any) => { return type == 'postal_code' }) >= 0) adress.postal_code = component.long_name;
            if (component.types.findIndex((type: any) => { return type == 'administrative_area_level_2' }) >= 0) adress.city = component.long_name;
            if (component.types.findIndex((type: any) => { return type == 'administrative_area_level_1' }) >= 0) adress.state = component.long_name;
            if (component.types.findIndex((type: any) => { return type == 'country' }) >= 0) adress.country = component.long_name;
          } else {
            if (adress.route == '') {
              if (component.types.findIndex((type: any) => { return type == 'route' }) >= 0) adress.route = component.long_name;
            }
          }
        });
      };
      if (adress.country != '' && adress.route != '') break;
    }
    if(this.authService.getAuthUser() == null){
      localStorage.setItem('functionLogin', 'newSpot');
    }
    this.router.navigate(['/spot'], {
      state: {
        data: {
          lat: this.rcOptionsTS.lat,
          lng: this.rcOptionsTS.lng,
          address: adress
        }
      }
    });
  }


  searchEnter(value: string) {
    let searchValue = (this.form.get('search')?.value)?.toLowerCase().trim();
    if (value.length == 0) {
      this.notification.notify('Please type something', 3000);
    } else {
      setTimeout(() => {
        if (this.spots$.length == 0) {
          this.searchSpot = true;
        } else {
          for (let i = 0; i < this.spots$.length; i++) {
            if (this.spots$[i].name.toLowerCase().indexOf(searchValue) !== -1) {
              this.setPosition(this.spots$[i]);
              return;
            }
          }
          this.searchSpot = true;
        }
        if (this.searchSpot) {
          if (this.searchResult.length == 0) {
            this.notification.notify('Não foi possivel encontrar nenhum local', 3000);
          } else {
            this.autoCompleteSelect(this.searchResult[0])
          }
        }
      }, 1000);
    }
  }

  async search(term: any) {
    this.search$.next(term);
  }

  openInfo(marker: MapMarker, content: any) {
    this.infoContent = content;
    this.info.open(marker)
  }

  clearDivs() {
    this.showAdvanced = false;
    //this.form.controls['search'].setValue(null);
    this.spots$ = [];
    this.searchResult = [];
    this.info.close();
    this.rcOptionsTS.display = 'none';
  }

  viewSpot(markerInfo: any) {
    this.clearDivs();
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
        //options: { animation: google.maps.Animation.BOUNCE, icon: spot.pictures ? spot.pictures[0] : './assets/icons/skateboard-icon.png' },
      })
    })
  }

  setPosition(spot: Spot) {
    this.showAdvanced = false;
    this.center = {
      lat: spot.lat,
      lng: spot.lng
    }

    this.myMarkers.forEach((result: any) => {
      if (result._position.lat == spot.lat && result._position.lng == spot.lng) {
        this.spots$ = [];
        this.searchResult = [];
        this.vertices = [];
        this.infoContent = spot;
        var latlng = new google.maps.LatLng(spot.lat, spot.lng);
        var bounds = new google.maps.LatLngBounds();
        bounds.extend(latlng)
        this.map.fitBounds(bounds);
        this.info.open(result)

      }
    })
  }
}
