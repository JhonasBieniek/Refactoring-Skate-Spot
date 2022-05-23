import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { collection, addDoc, orderBy, query, startAt, endAt, getDocs, CollectionReference, where, setDoc, doc, getDoc, updateDoc, DocumentReference, arrayRemove, arrayUnion} from "firebase/firestore";
import { getFirestore } from 'firebase/firestore'
import { Observable } from 'rxjs';
import { Skater } from 'src/app/pages/skaters/shared/skater.model';

@Injectable({
    providedIn: 'root'
})
export class SkaterService {

    skaters: CollectionReference;

    private db = getFirestore();

    constructor(private http: HttpClient) {
        this.skaters = collection(this.db, '/skaters/');
        //enableIndexedDbPersistence(this.db)
    }

    get_instagramID(url: string): Observable<any> {
        return this.http.get(url);
    }

    getToken(url:string, requestData: any): Observable<any> {

        let body = JSON.stringify(requestData);
        const ParseHeaders = {
            headers: new HttpHeaders({
                'Content-Type': 'application/json'
            })
        };
        return this.http.post(url, body, ParseHeaders);
    }

    getSkaterView(uid: string) {
        const docRef = doc(this.db, "skaters", uid);
        return getDoc(docRef);
    }

    createSkater(data: Skater) {
        data['modified'] = new Date()
        return setDoc(doc(this.db, "skaters", data.user_uid), data,{ merge: true });
    }

    addFavorite(user_uid: string, spot_uid: string){
        const userDoc = doc(this.db, "skaters", user_uid);
        //console.log("Adding: "+ spot_uid + 'to yours favorites');
        return updateDoc(userDoc, {
            favorites_spots: arrayUnion(spot_uid),
            modified: new Date()
        });
    }
    removeFavorite(user_uid: string, spot_uid: string){
        const userDoc = doc(this.db, "skaters", user_uid);
        //console.log("Remove: "+ spot_uid + 'from yours favorites');
        return updateDoc(userDoc, {
            favorites_spots: arrayRemove(spot_uid),
            modified: new Date()
        });
    }

    updateSkater(skater_uid: string, data:any){
        data['modified'] = new Date();
        const userDoc = doc(this.skaters, skater_uid);
        //console.log("Adding: "+ spot_uid + 'to yours favorites');
        return updateDoc(userDoc, data);
    }
}