import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class RouteHelperService {
  private urls = new BehaviorSubject<string[]>(['']);

  constructor(
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute) {
      this.setupRouting();
    }

    private setupRouting() {
      //console.log("entrou aqui")
      // this.router.events.pipe(
      //   filter(event => event instanceof NavigationEnd),
      //   map(() => this.activatedRoute),
      //   map(route => {
      //     while (route.firstChild) {
      //       route = route.firstChild;
      //     }
      //     return route;
      //   }),
      //   filter(route => route.outlet === 'primary')
      // ).subscribe((route: ActivatedRoute) => {
      //   const seo = route.snapshot.data['seo'];
      //   // set your meta tags & title here
      //   this.seoSocialShareService.setData(seo);
      // });
    }

    nextUrl(url: string[]){
      this.urls.next(url)
    }
    
    getPreviousUrl(){
      let url = this.urls.getValue();
      url.splice(url.length-1);
      return url[url.length-1];
    }


}
