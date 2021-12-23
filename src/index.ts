import { Context } from 'koa';
import { SetupFunction } from '@zenweb/core';

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
  success?(ctx: Context, data?: any): any;

  /**
   * 错误结果包装
   */
  fail?(ctx: Context, err: ApiFail): any;
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

const defaultOption: ApiOption = {
  failStatus: 422,
  fail(ctx, err) {
    return {
      code: err.code,
      data: err.data,
      message: err.message,
    };
  },
  success(ctx, data) {
    return { data };
  },
};

/**
 * 安装 ctx.success ctx.fail
 */
export default function setup(option?: ApiOption): SetupFunction {
  option = Object.assign({}, defaultOption, option);
  return function api(setup) {
    setup.debug('option: %o', option);

    // 捕获 context 中的错误异常
    setup.middleware(async function failCatch(ctx, next) {
      try {
        await next();
      } catch (err) {
        if (err instanceof ApiFail) {
          ctx.status = err.status || 422;
          ctx.type = 'json';
          ctx.body = option.fail(this, err);
          return;
        }
        throw err;
      }
    });

    // 在 ctx 中安装 fail 函数
    /**
     * 抛出错误信息
     * @throws {ApiFail}
     */
    function fail(msg: string | ApiFailDetail) {
      const {
        code = option.failCode,
        message,
        data = undefined,
        status = option.failStatus,
      } = typeof msg === 'object' ? msg : { message: msg };
      throw new ApiFail(message, code, data, status);
    }
    setup.defineContextProperty('fail', { value: fail });

    /**
     * 在 ctx 中安装 success 函数
     * 在控制器中需要返回成功信息时候调用 return ctx.success(data)
     */
    function success(data?: any) {
      this.type = 'json';
      this.body = option.success(this, data);
    }
    setup.defineContextProperty('success', { value: success });
  }
}

declare module 'koa' {
  interface DefaultContext {
    fail(msg: string | ApiFailDetail): never;
    success(data?: any): any;
  }
}
