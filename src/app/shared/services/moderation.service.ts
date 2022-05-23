import { Injectable } from '@angular/core';
import { collection, addDoc, CollectionReference} from "firebase/firestore";
import { getFirestore } from 'firebase/firestore'

export interface Moderation {
    spot_uid: string;
    spot_name: string;
    moderation_uid: string | null;
    situation: string;
    user_uid: string;
    spot_country: string;
    user: any;
    created?: Date;
    modified: Date;
}


@Injectable({
    providedIn: 'root'
})
export class ModerationService {

    moderations: CollectionReference;

    private db = getFirestore();

    constructor() {
        this.moderations = collection(this.db, '/moderations/');
    }

    addModeration(spot_uid: string, spot_name:string, situation: string, user_uid: string, spot_country:string, user: any) {
        let moderation: Moderation = {
            spot_uid: spot_uid,
            spot_name: spot_name,
            moderation_uid: null,
            situation: situation,
            user_uid: user_uid,
            spot_country: spot_country,
            user: user,
            created: new Date(),
            modified: new Date()
        }

        return addDoc(this.moderations, moderation);
    }

    // Get all stars that belog to a Movie
    // getSpotReports(spotId:string) {
    //     console.log(spotId)
    //     let q =  query(this.reports, where("spot_uid", "==", spotId));

    //     return getDocs(q);  
    // }

}