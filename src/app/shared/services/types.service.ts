import { Injectable } from '@angular/core';
import { addDoc, collection, CollectionReference, deleteDoc, doc, getDocs, getFirestore, orderBy, query, updateDoc, where } from 'firebase/firestore';

export interface Types {
    status: boolean;
    name: string;
}

@Injectable({
    providedIn: 'root'
})
export class TypesService {

    types: CollectionReference;

    private db = getFirestore();

    constructor() {
        this.types = collection(this.db, '/types/');
    }

    getTypes() {
        const q = query(this.types, orderBy("position"), where("status", "==", true));
        return getDocs(q);
    }
}
