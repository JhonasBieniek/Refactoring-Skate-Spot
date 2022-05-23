import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Observable, Subject} from 'rxjs';
import { filter } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class SharedService {

    constructor(private router: Router) {
        this.currentUrl = this.router.url;
        router.events.subscribe(event => {
            if (event instanceof NavigationEnd) {        
                this.previousUrl = this.currentUrl;
                this.currentUrl = event.url;
            };
        });
    }

    //* variables to request controller action
    private subject = new Subject<any>();
    private boundRequest = new Subject<any>();
    //* end variables

    //* variables for skate editor
    public readonly: boolean =  true;
    //* end variables

    //* variables for spot edit
    public currentSpotUser_uid: string = '';
    public currentSpot_uid: string = '';
    //* end variables

    //* variables for back function
    private lastBounds!: google.maps.LatLngBounds;
    private LastLatLng!: google.maps.LatLng;

    private previousUrl!: string;
    private currentUrl!: string;
    //* end variables 

    sendClickEvent(){
        this.subject.next();
    }

    getClickEvent():Observable<any>{
        return this.subject.asObservable();
    }

    //* function to request viewBounds from map to use in back function
    sendMapRequestView(){
        this.boundRequest.next();
    }

    getMapRequestView(){
        return this.boundRequest.asObservable();
    }
    
    saveLastBounds(bounds: google.maps.LatLngBounds, center: google.maps.LatLng){
        this.lastBounds = bounds;
        this.LastLatLng = center;
    }

    getLastBounds():google.maps.LatLngBounds {
        return this.lastBounds;
    }

    getLastLatLng():google.maps.LatLng {
        return this.LastLatLng;
    }

    getPreviousUrl(){
        return this.previousUrl;
    }
}
