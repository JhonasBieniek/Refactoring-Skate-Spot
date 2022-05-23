import { NgxImageCompressService, DataUrl } from 'ngx-image-compress';
import { MatSnackBar } from '@angular/material/snack-bar';
import { imagePreview } from '../spot.component';
import { Injectable } from '@angular/core';
import { collection, addDoc, orderBy, query, startAt, endAt, getDocs, CollectionReference, where, setDoc,doc, getDoc, updateDoc, DocumentReference, collectionGroup } from "firebase/firestore";
import { getFirestore } from 'firebase/firestore'
import { geohashQueryBounds, distanceBetween} from 'geofire-common';
import { getStorage, ref, uploadString, getDownloadURL, UploadTask, deleteObject } from "firebase/storage";
import { Observable, BehaviorSubject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { DOC_ORIENTATION } from 'ngx-image-compress';

import { Spot } from './models/spot.model';
import { Moderation } from './models/moderation.model';
import { Report } from './models/report.model';
import { Star } from './models/star.model';
import { Review } from './models/review.model';

@Injectable({
  providedIn: 'root'
})
export class SpotService {

  moderations: CollectionReference;
  reports: CollectionReference;
  spots: CollectionReference;

  thumbnail: any;
  maxImgs: number = 9;
  selectedFiles: any[] = [];
  previews: imagePreview[] = [];
  spotsData!: [Spot];

  private navbarValue = new BehaviorSubject<boolean>(false);
  private db = getFirestore();
  private storage = getStorage();


  constructor(private httpClient: HttpClient,   private _snackBar: MatSnackBar, private imageCompress: NgxImageCompressService) {
    this.spots = collection(this.db,'/spots/');
    this.reports = collection(this.db, '/reports/');
    this.moderations = collection(this.db, '/moderations/');
    //enableIndexedDbPersistence(this.db)
  }

  downloadImage(url: string): Observable<string> {
    return this.httpClient.get(url, { responseType: 'blob' })
      .pipe(
        switchMap((response: any) => this.readFile(response))
      );
  }

  private readFile(blob: Blob): Observable<string> {
    return Observable.create((obs:any) => {
      const reader = new FileReader();

      reader.onerror = err => obs.error(err);
      reader.onabort = err => obs.error(err);
      reader.onload = () => obs.next(reader.result);
      reader.onloadend = () => obs.complete();

      return reader.readAsDataURL(blob);
    });
  }

  async uploadImageAsPromise(imageFile:string, path:string, orientation: DOC_ORIENTATION, cover: boolean) {
    let storageref = ref(this.storage, path);

    return await uploadString(storageref, imageFile, 'data_url').then(async function (task) {
      return getDownloadURL(storageref);
    }).then(function (downloadURL) {
        return {
          downloadURL: downloadURL,
          path: path,
          orientation: orientation,
          cover: cover
        };
    });
  }

  deleteImage(path:string) {
    let storageRef = ref(this.storage, path);

    return deleteObject(storageRef);
  }

  updateSpot(spot_uid: string, data:any){
    data['modified'] = new Date();
    const userDoc = doc(this.db, "spots", spot_uid);
    //console.log("Adding: "+ spot_uid + 'to yours favorites');
    return updateDoc(userDoc, data);
  }
  
  async createSpot(data:Spot, files: any[], thumbnail: any) {

    const newSpot = doc(this.spots);
    data.uid = newSpot.id;
    
    let response = await setDoc(newSpot, data)
      .then(async () => {
        let status = {
          status: false,
          data: '',
          uid: '',
        }
        if(files.length > 0){
          //let spotName = data.name.replace(/ /g,"_");

          let promises = [];

          for (let index = 0; index < files.length; index++) {
            let path = "spots/"+  data.uid +"/"+ files[index].name + "_"+ Date.now()+".png";
            promises.push(this.uploadImageAsPromise(files[index].file, path, files[index].orientation, files[index].cover));
          }
          
          let result = await Promise.all(promises).then(function(values) {
              return {
                status: true,
                data: values
              };
          }).catch(function(error) {
              //console.log("One of the promises rejected.", error);
              return {
                status: false,
                data: error
              }
          });

          if(result.status == true){

            data.thumbnail = await this.uploadImageAsPromise(thumbnail.file, "spots/"+ data.uid +"/"+thumbnail.name + "_thumbnail.png", thumbnail.orientation, thumbnail.cover);

            data.pictures = result.data;
            let docref = await doc(this.db, "/spots/"+data.uid);
            result = await updateDoc(docref,{...data}).then(function(response) {
              return {
                status: true,
                data: "Successfully"
              }
            }).catch(function(error) {
              //console.log("update Error.", error);
              return {
                status: false,
                data: error
              }
            });
          }
          status.data = result.data;
          status.status = result.status;
          status.uid = newSpot.id;
        }
        
        return status
      }).catch((error: any) => {
        return {
          status: false,
          data: error,
          uid: '',
        }
      })
    return response
  }

  async getSpots(lat:number, lng:number, radius: number, advanced: boolean, conditions: any){
    // Find cities within 50km of London
    let center = [lat, lng];
    let radiusInM = radius * 1000;

    let bounds = geohashQueryBounds(center, radiusInM);
    let promises: any = [];
    let selectedConditions: any[string] = [];

    conditions.forEach((element:any) => {
      if(element.selected == true){
        selectedConditions.push(element.name)
      }
    });
    
    //let q = query(collection(this.db,'Spot'), orderBy("Spot"))
    for (const b of bounds) {
      let q;
      if(selectedConditions.length == 0){
        q =  query(this.spots, orderBy("hash") , startAt(b[0]) , endAt(b[1]), where("status", "==", "active"));
      }else{
        q =  query(this.spots, orderBy("hash") , startAt(b[0]) , endAt(b[1]), where("types", "array-contains-any", selectedConditions), where("status", "==", "active"));
      }
      // if(advanced){
      //   let selectedConditions: any[string] = []  ;
      //   conditions.forEach((element:any) => {
      //     if(element.selected == true){
      //       selectedConditions.push(element.name)
      //     }
      //   });
      //   if(selectedConditions.length == 0){
      //     q =  query(this.spots, orderBy("hash") , startAt(b[0]) , endAt(b[1]));
      //   }else{
      //     q =  query(this.spots, orderBy("hash") , startAt(b[0]) , endAt(b[1]), where("types", "array-contains-any", selectedConditions));
      //   }
      // }else{
      //   q =  query(this.spots, orderBy("hash") , startAt(b[0]) , endAt(b[1]));
      // }
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        promises.push(doc.data());
      });
    }
    //console.log(promises);
    let matchingDocs:any = [];

    promises.forEach((doc:any) => {
      const distanceInKm = distanceBetween([doc.lat, doc.lng], center);
      const distanceInM = distanceInKm * 1000;
      if (distanceInM <= radiusInM) {
        matchingDocs.push(doc);
      }
    });


    return matchingDocs;
  }

  async getAllMapSpots(){
    
    //let querySnapshot = await getDocs(this.spots);
    let q = query(this.spots, where("status", "==", "active"))
    let querySnapshot = await getDocs(q);
    let allSpots: any[] =  [];
    querySnapshot.forEach((doc) => {
      allSpots.push(doc.data());
    });
    return allSpots;
  }

  async getSkaterSpots(user_uid:string,){
    let q =  query(this.spots, orderBy("name"), where("user_uid", "==", user_uid));

    return getDocs(q);    
    //console.log(promises);
    //return matchingDocs;
  }

  getSpotView(uid:string){
    const docRef = doc(this.db, "spots", uid);
    return getDoc(docRef);

    /*if (docSnap.exists()) {
      console.log("Document data:", docSnap.data());
    } else {
      // doc.data() will be undefined in this case
      console.log("No such document!");
    }*/
  }

  async getAllSpots(searchText: string){
    //console.log(searchText);
    if(searchText) {
      let querySnapshot = getDocs(this.spots);
      let allSpots: any[] =  [];

      (await querySnapshot).forEach((doc) => {
        let spot =  doc.data();
        spot['id'] = doc.id;
        if(spot.name.toLowerCase().indexOf(searchText.toLowerCase()) !== -1){
          allSpots.push(spot)
        }else if(spot.address.route.toLowerCase().indexOf(searchText.toLowerCase()) !== -1){
          allSpots.push(spot)
        }
      });
      return allSpots
    }else{
      return [];
    }
  }

  readSearchBar() {
    let view = this.navbarValue.getValue();
    return view;
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

  getSpotStars(spot_uid: string) {
    const docRef = collection(this.db, "spots", spot_uid, "stars");
    return docRef;
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
  
  updateStar(user_uid:any, spot_uid:any, value:number) {
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

    getSpotReviews(spot_uid: string) {
      const docRef = collection(this.db, "spots", spot_uid, "reviews");
      return docRef;
  }

  createReview(user_uid: string, spot_uid: string, user_name: string, review: string) {
      let date: Date =  new Date();
      const reviewData: Review = { user_uid, user_name, review , created: date, modified: date};
      const CollectionReference = collection(this.db, "spots", spot_uid, "reviews");
      return addDoc(CollectionReference, reviewData);
  }

}