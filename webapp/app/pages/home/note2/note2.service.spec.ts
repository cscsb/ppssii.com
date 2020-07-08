import {TestBed} from '@angular/core/testing';

import {Note2Service} from './note2.service';
import {HttpClient} from "@angular/common/http";
import {UrlService} from "../../../common/service/url.service";

describe('Note2Service', () => {
    let service: Note2Service;
    let urlService: UrlService;
    let http: UrlService;
    beforeEach(() => {
        TestBed.configureTestingModule({providers: [HttpClient, UrlService]});
        service = TestBed.inject(Note2Service);
        urlService = TestBed.inject(UrlService);
        // http = TestBed.inject(HttpClient);
    });

    // it('should be created', () => {
    //     expect(service).toBeTruthy();
    // });

    it('端口域名前缀为 /api/', () => {
        expect(urlService.getUrl('test')).toBe('http://localhost:3000/api/test');
    });
});
