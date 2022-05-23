import { BaseService } from './../../../core/services/base.service';
import { Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren, ViewEncapsulation } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { AuthService } from 'src/app/shared/services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { GoogleMap, MapInfoWindow, MapMarker } from '@angular/google-maps';
import { SpotService } from '../../spot/shared/spot.service';
import { Spot } from '../../spot/shared/models/spot.model';
import { Title } from '@angular/platform-browser';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { Platform } from '@angular/cdk/platform';
import { debounceTime } from 'rxjs/operators';
import { MapsAPILoader } from '@agm/core';
import { TypesService } from 'src/app/shared/services/types.service';
import { SharedService } from 'src/app/shared/services/shared.service';
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
export class BaseComponent extends BaseService implements OnInit {
  @ViewChild(MapInfoWindow, { static: false }) info!: MapInfoWindow;
  @ViewChild(GoogleMap, { static: false }) map!: GoogleMap;
  @ViewChildren(MapMarker) myMarkers!: QueryList<google.maps.Marker>;
  @ViewChild('searchInput') searchElementRef!: ElementRef;
  myStyles: google.maps.MapTypeStyle[] = [];

  zoom = 22;
  platformOpeating: any

  constructor(
    protected fb: FormBuilder,
    protected router: Router,
    protected title: Title,
    protected mapsAPILoader: MapsAPILoader,
    protected breakpointObserver: BreakpointObserver,
    protected navbarService: NavbarService,
    protected authService: AuthService,
    protected dialog: MatDialog,
    protected spotService: SpotService,
    protected notification: NotificationService,
    protected platform: Platform,
    protected typesService: TypesService,
    protected sharedService: SharedService,
    protected route: ActivatedRoute,
    protected http: HttpClient
  ) {
    super(fb, router, title, mapsAPILoader, breakpointObserver, navbarService, authService, dialog, spotService, notification, platform, typesService, sharedService, route, http)
    this.platformOpeating = platform
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
      this.startMaps();
      this.autocompleteService = new google.maps.places.AutocompleteService();
    });

    this.search$
      .pipe(debounceTime(400))
      .subscribe(async (term) => {
        this.searchResult = [];
        this.spots$ = [];
        term = term.toLowerCase().trim();

        if (term) {
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
            });
            this.spots$.push(spot)
          }
        });
        this.watchPostion()

      }
    }, 150);
  }

  autoCompleteSelect(value: google.maps.places.QueryAutocompletePrediction) {
    this.getGeoLocation(value.description).subscribe(async (res: google.maps.GeocoderResult) => {
      let politicalCheck = res.types.findIndex(type => { return type === "political" });
      let localityCheck = res.types.findIndex(type => { return type === "locality" });
      if (res.geometry.viewport) {
        const viewport = res.geometry.viewport.toJSON();
        this.map.fitBounds(res.geometry.viewport);
      }
      this.clearDivs();
    });
  }

  clear(form: string) {
    this.spots$ = [];
    this.form.get(form)?.setValue('');
  }

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

  click(event: google.maps.MapMouseEvent) {
    this.form.controls['search'].setValue(null);
    this.showAdvanced = false;
    this.spots$ = [];
    if (this.rcOptionsTS.display == 'none') {
      this.ReverseGeocodingData(event.latLng.lat(), event.latLng.lng());
    } else {
      this.rcOptionsTS.display = 'none';
    }
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
