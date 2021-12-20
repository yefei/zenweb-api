import Debug from 'debug';
import { Core } from '@zenweb/core';

const debug = Debug('zenweb:api');

export interface ApiOption {
  /**
   * 默认失败代码: 无
   */
  failCode?: number;

  /**
   * 默认失败HTTP状态码: 422
   */
  failStatus?: number;

  /**
   * 成功结果包装
   */
  success?(data?: any): any;

  /**
   * 错误结果包装
   */
  fail?(err: ApiFail): any;
}

export interface ApiFailDetail {
  message?: string;
  code?: number;
  status?: number;
  data?: any;
}

export class ApiFail extends Error {
  expose: boolean = true;
  code: number;
  data: any;
  status: number;

  /**
   * @param message 错误消息
   * @param code 错误代码
   * @param data 附加数据
   * @param status HTTP代码
   */
  constructor(message: string, code?: number, data?: any, status?: number) {
    super(message);
    this.code = code;
    this.data = data;
    this.status = status || 422;
  }
}

/**
 * 安装 ctx.success ctx.fail
 */
export function setup(core: Core, option?: ApiOption) {
  const app = core.koa;
  const originContextOnError = app.context.onerror;
  const defaultOption: ApiOption = {
    failStatus: 422,
    fail(err) {
      return {
        code: err.code,
        data: err.data,
        message: err.message,
      };
    },
    success(data) {
      return { data };
    },
  };
  option = Object.assign(defaultOption, option);

  debug('option: %o', option);

  /**
   * 自定义错误处理
   */
  app.context.onerror = function onerror(err: Error | ApiFail) {
    if (null == err) return;
    let data;
    let status = 500;
    if (!(err instanceof ApiFail)) {
      if (debug.enabled) {
        // error info
        data = {
          name: err.name,
          message: err.message,
          stack: err.stack,
        };
      } else {
        return originContextOnError.call(this, err);
      }
    } else {
      status = err.status || 422;
      data = option.fail.call(this, err);
    }
    // respond
    const msg = JSON.stringify(data);
    this.type = 'json';
    this.status = status;
    this.length = Buffer.byteLength(msg);
    this.res.end(msg);
  };

  /**
   * 在 ctx 中安装 fail 函数
   * @throws {ApiFail}
   */
  app.context.fail = function fail(msg) {
    const {
      code = option.failCode,
      message,
      data = undefined,
      status = option.failStatus,
    } = typeof msg === 'object' ? msg : { message: msg };
    throw new ApiFail(message, code, data, status);
  };

  /**
   * 在 ctx 中安装 success 函数
   * 在控制器中需要返回成功信息时候调用 return ctx.success(data)
   */
  app.context.success = function success(data) {
    this.type = 'json';
    this.body = option.success.call(this, data);
  };
}

declare module 'koa' {
  interface BaseContext {
    fail(msg: string | ApiFailDetail): never;
    success(data?: any): any;
  }
}
