import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiMoreOptions, HttpRequestConfig } from '../interfaces/api-service.interface';
import { Observable, } from 'rxjs';
import { environment } from '../../../envs/envs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  httpClient = inject(HttpClient);

  private readonly base_url = environment.BASE_URL

  protected _createHttpConfig(options: ApiMoreOptions): HttpRequestConfig {
    const { params, moreOptions = {} } = options;
    const finalParams = moreOptions.params || params;

    return {
      ...moreOptions,
      params: finalParams,
      withCredentials: moreOptions.withCredentials ?? false,
    };
  }

  private createURl(endpoint: string) {
    return `${this.base_url}/${endpoint}`
  }

  get<T>(url: string, options: ApiMoreOptions = {}): Observable<T> {
    const httpConfig = this._createHttpConfig(options);

    console.log({ url: this.createURl(url), httpConfig });

    const httpOperation = () => this.httpClient.get<T>(this.createURl(url), httpConfig);

    return httpOperation();
  }

  post<T>(url: string, body: any, options: ApiMoreOptions = {}): Observable<T> {
    const httpConfig = this._createHttpConfig(options);

    const httpOperation = () => this.httpClient.post<T>(this.createURl(url), body, httpConfig);

    return httpOperation();
  }

  put<T>(url: string, body: any, options: ApiMoreOptions = {}): Observable<T> {
    const httpConfig = this._createHttpConfig(options);

    const httpOperation = () => this.httpClient.put<T>(this.createURl(url), body, httpConfig);

    return httpOperation();
  }

  patch<T>(url: string, body: any, options: ApiMoreOptions = {}): Observable<T> {
    const httpConfig = this._createHttpConfig(options);

    const httpOperation = () => this.httpClient.patch<T>(this.createURl(url), body, httpConfig);

    return httpOperation();
  }

  delete<T>(url: string, options: ApiMoreOptions = {}): Observable<T> {
    const httpConfig = this._createHttpConfig(options);

    const httpOperation = () => this.httpClient.delete<T>(this.createURl(url), httpConfig);

    return httpOperation();
  }
}
