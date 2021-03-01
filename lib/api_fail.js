'use strict';

class ApiFail extends Error {
  /**
   * @param {string} [message] 错误消息
   * @param {number} [code] 错误代码
   * @param {*} [data] 附加数据
   * @param {number} [httpCode] 错误代码
   */
  constructor(message, code, data, httpCode) {
    super(message);
    this.expose = true;
    this.code = code;
    this.data = data;
    this.httpCode = httpCode || 422;
  }
}

module.exports = ApiFail;
