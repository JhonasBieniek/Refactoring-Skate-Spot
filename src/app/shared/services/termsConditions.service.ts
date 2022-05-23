import { Injectable } from '@angular/core';
import { collection, addDoc, orderBy, query, startAt, endAt, getDocs, CollectionReference, where, setDoc, doc, getDoc, updateDoc, deleteDoc, limit } from "firebase/firestore";
import { getFirestore } from 'firebase/firestore';

export interface terms {
    status: boolean;
    name: string;
    content: string;
    uid?: string;
    last_modifier_user_uid?: string;
    created?: Date;
    modified?: Date;
}

@Injectable({
    providedIn: 'root'
})
export class TermsService {

    terms_conditions: CollectionReference;

    private db = getFirestore();

    constructor() {
        this.terms_conditions = collection(this.db, '/terms_conditions/');
    }

    getTerms() {
        const q = query(collection(this.db, "terms_conditions"), orderBy("name", "asc"), where("status", "==", true));
        return getDocs(q);
        //return getDocs(this.conditions);
    }
}
