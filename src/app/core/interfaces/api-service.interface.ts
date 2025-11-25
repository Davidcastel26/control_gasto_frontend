import { HttpContext, HttpHeaders, HttpParams } from "@angular/common/http";

export type ApiMoreOptions = {
    params?: any;
    moreOptions?: {
        headers?:
        | HttpHeaders
        | {
            [header: string]: string | string[];
        };
        context?: HttpContext;
        observe?: any;
        params?:
        | HttpParams
        | {
            [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean>;
        };
        reportProgress?: boolean;
        responseType?: any;
        withCredentials?: boolean;
        transferCache?:
        | {
            includeHeaders?: string[];
        }
        | boolean;
    };
};

export interface HttpRequestConfig {
    params?: any;
    withCredentials: boolean;
    [key: string]: any;
}