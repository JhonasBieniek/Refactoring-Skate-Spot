import { setDoc } from 'firebase/firestore';
import { CollectionReference, collection, getFirestore, updateDoc, doc, addDoc } from 'firebase/firestore';
import { Injectable } from '@angular/core';
import { Moderation } from '../models/moderation.model';
import { Report } from '../models/report.model';
import { Star } from '../models/star.model';
import { Review } from '../models/review.model';

@Injectable({
    providedIn: 'root'
})

export class sendData {
    moderations: CollectionReference;
    reports: CollectionReference;

    private db = getFirestore();

    constructor() {
        this.reports = collection(this.db, '/reports/');
        this.moderations = collection(this.db, '/moderations/');

      }

    addReport(reason: string, spot_uid: string, user_uid: string, status: string, spot_country: string, spot_name: string, user: string) {
        let report: Report = {
            spot_uid: spot_uid,
            user_uid: user_uid,
            user: user,
            spot_name: spot_name,
            status: status,
            spot_country: spot_country,
            reason: reason,
            moderation_uid: null,
            created: new Date(),
            modified: new Date()
        }
        return addDoc(this.reports, report);
    }

    addModeration(spot_uid: string, spot_name: string, situation: string, user_uid: string, spot_country: string, user: any) {
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

    setStar(user_uid:any, spot_uid:any, value:number) {
        let date = new Date();
        const star: Star = { 
          user_uid, 
          value,
          created: date,
          modified: date
        };
        const CollectionReference = collection(this.db, "spots", spot_uid, "stars");
        const newStar = doc(CollectionReference, user_uid);
        return setDoc(newStar, star);
      }

    updateStar(user_uid: any, spot_uid: any, value: number) {
        const star: Star = {
            user_uid,
            value,
            modified: new Date()
        };

        const docRef = doc(this.db, "spots", spot_uid, "stars", user_uid);
        return updateDoc(docRef, {
            ...star
        })
    }

    createReview(user_uid: string, spot_uid: string, user_name: string, review: string) {
        let date: Date = new Date();
        const reviewData: Review = { user_uid, user_name, review, created: date, modified: date };
        const CollectionReference = collection(this.db, "spots", spot_uid, "reviews");
        return addDoc(CollectionReference, reviewData);
    }



}