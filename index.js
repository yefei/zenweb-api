'use strict';

const debug = require('debug')('zenweb:api');

class ApiFail extends Error {
  /**
   * @param {string} [message] 错误消息
   * @param {number} [code] 错误代码
   * @param {*} [data] 附加数据
   * @param {number} [status] HTTP代码
   */
  constructor(message, code, data, status) {
    super(message);
    this.expose = true;
    this.code = code;
    this.data = data;
    this.status = status || 422;
  }
}

/**
 * 安装拦截 fail 错误
 * @param {import('@zenweb/core').Core} core
 * @param {object} [options] 配置项
 * @param {object} [options.api] API配置
 * @param {number} [options.api.failCode=undefined] 默认失败代码
 * @param {number} [options.api.failStatus=422] 默认失败HTTP状态码
 * @param {function(object):object} [options.api.success] 成功结果包装
 * @param {function(ApiFail):object} [options.api.fail] 失败结果包装
 */
function setup(core, options) {
  const app = core.koa;
  const originContextOnError = app.context.onerror;

  options = Object.assign({
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
  }, options);

  debug('options: %o', options);

  /**
   * 自定义错误处理
   * @param {Error} err 
   */
  app.context.onerror = function onerror(err) {
    if (null == err) return;
    let data;
    let status = 500;
    if (!(err instanceof ApiFail)) {
      if (debug.enabled) {
        // error info
        data = {
          name: err.name,
          code: err.code,
          message: err.message,
          stack: err.stack,
        };
      } else {
        return originContextOnError.call(this, err);
      }
    } else {
      status = err.status || 422;
      data = options.fail.call(this, err);
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
   * @param {string|object} msg 错误消息 | 消息对象
   * @param {string} msg.message 错误消息
   * @param {number} [msg.code] 错误代码
   * @param {number} [msg.status] 自定义 http 错误代码
   * @param {*} [msg.data] 附加数据
   * @throws {HttpError}
   */
  app.context.fail = function fail(msg) {
    const { code, message, data, status } = typeof msg === 'object' ? msg : { message: msg };
    throw new ApiFail(message, code || options.failCode, data, status || options.failStatus);
  };

  /**
   * 在 ctx 中安装 success 函数
   * 在控制器中需要返回成功信息时候调用 return ctx.success(data)
   * @param {*} data
   */
  app.context.success = function success(data) {
    this.type = 'json';
    this.body = options.success.call(this, data);
  };
}

module.exports = {
  setup,
  ApiFail,
};
