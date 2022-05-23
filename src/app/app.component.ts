import { RouteHelperService } from './shared/services/route-helper.service';
import { NavigationEnd, NavigationStart, Router, Event, NavigationError } from '@angular/router';
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'SkateBoardOnly';
  urls: string[] = [];

  constructor(private router: Router, public routeService: RouteHelperService) {
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        if(event.url == '/'){
          this.urls = ['/'];
          localStorage.removeItem('spotValue')
          localStorage.removeItem('spotImages')
          localStorage.removeItem('spotGeolocation')
          localStorage.removeItem('spotCreating')
        }
        if(this.urls.length > 0){
          if(this.urls.indexOf(event.url) === -1){
            this.urls.push(event.url)
            this.routeService.nextUrl(this.urls)
          }
        } else {
          this.urls.push(event.url) 
          this.routeService.nextUrl(this.urls)
        }
      }
      if (event instanceof NavigationError) {
          console.log(event.error);
      }
  });
};

}
