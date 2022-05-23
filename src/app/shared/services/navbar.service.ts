import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class NavbarService {
  private searchBarValue = new BehaviorSubject<boolean>(false);
  private watchPositionValue = new BehaviorSubject<number>(-1);
  public currentValue: boolean = this.searchBarValue.getValue()
  searchBarOpened = this.searchBarValue.asObservable();

  constructor(
  ) { }
  
  showSearchBar() {
    let view = this.searchBarValue.getValue();
    return view;
  }

  toggleSearchBar(){
    this.searchBarValue.getValue() ? this.searchBarValue.next(false) : this.searchBarValue.next(true);
  }

  readWatchPositionID(){
    let num = this.watchPositionValue.getValue();
    return num;
  }

  nextWatchPositionID(num: number){
    this.watchPositionValue.next(num);
  }

}

