import { CollectionReference, collection, getFirestore, query, orderBy, where, getDocs } from 'firebase/firestore';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { filter, finalize } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class SharedService {

    private urls = new BehaviorSubject<string[]>(['']);
    private db = getFirestore();
    terms_conditions: CollectionReference;

    constructor(private router: Router, private _snackBar: MatSnackBar) {
        this.terms_conditions = collection(this.db, '/terms_conditions/');
        this.currentUrl = this.router.url;
        router.events.subscribe(event => {
            if (event instanceof NavigationEnd) {        
                this.previousUrl = this.currentUrl;
                this.currentUrl = event.url;
            };
        });
    }

    public isLoading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

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

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        this.isLoading.next(true);
    
        return next.handle(req).pipe(
          finalize(
            () => {
              this.isLoading.next(false);
            }
          )
        );
    }

    nextUrl(url: string[]){
        this.urls.next(url)
    }
      
    getPreviousUrl(){
        let url = this.urls.getValue();
        url.splice(url.length-1);
        return url[url.length-1];
    }  

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
    
    getTerms() {
        const q = query(collection(this.db, "terms_conditions"), orderBy("name", "asc"), where("status", "==", true));
        return getDocs(q);
    }

    notify(message:string, duration:number){
        this._snackBar.open(message, undefined, {
          duration: duration,
          }
        );
    }

}
