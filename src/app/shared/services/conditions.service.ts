import { Injectable } from '@angular/core';
import { collection, addDoc, orderBy, query, startAt, endAt, getDocs, CollectionReference, where, setDoc, doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { getFirestore } from 'firebase/firestore';

export interface Conditions {
    status: boolean;
    name: string;
}

@Injectable({
    providedIn: 'root'
})
export class ConditionsService {

    conditions: CollectionReference;

    private db = getFirestore();

    constructor() {
        this.conditions = collection(this.db, '/conditions/');
    }

    getConditions() {
        const q =  query(this.conditions, orderBy("position"), where("status", "==", true));
        return getDocs(q);
    }
}
