import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CollectionReference, collection, getFirestore, query, getDocs, where, orderBy } from 'firebase/firestore';

@Injectable({
    providedIn: 'root'
})
export class receiveData{

    conditions: CollectionReference;
    types: CollectionReference;

    private db = getFirestore();
    private navbarValue = new BehaviorSubject<boolean>(false);

    constructor(){
        this.conditions = collection(this.db, '/conditions/');
        this.types = collection(this.db, '/types/');        
    }
  
    getSpotStars(spot_uid: string) {
        const docRef = collection(this.db, "spots", spot_uid, "stars");
        return docRef;
    }

    getConditions() {
        const q =  query(this.conditions, orderBy("position"), where("status", "==", true));
        return getDocs(q);
    }

    getTypes() {
        const q = query(this.types, orderBy("position"), where("status", "==", true));
        return getDocs(q);
    }

    getSpotReviews(spot_uid: string) {
        const docRef = collection(this.db, "spots", spot_uid, "reviews");
        return docRef;
    }    

    readSearchBar() {
        let view = this.navbarValue.getValue();
        return view;
      }
}