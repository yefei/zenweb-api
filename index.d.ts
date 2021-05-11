import 'koa';

export interface ApiFailDetail {
  message?: string;
  code?: number;
  status?: number;
  data?: any;
}

export declare class ApiFail extends Error {
  constructor(message?: string, code?: number, data?: any, status?: number);
}

export interface ApiOptions {
  failCode?: number;
  failStatus?: number;
  success?(data: any): any;
  fail?(err: ApiFail): any;
}

declare module 'koa' {
  interface BaseContext {
    fail(msg: string | ApiFailDetail): never;
    success(data: any): any;
  }
}
