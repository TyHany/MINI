const crypto = require('crypto');
const xml2js = require('xml2js');
const axios = require('axios');
const config = require('../config');
const logger = require('./logger');

class WXPay {
  constructor() {
    this.mchId = config.wxpay.mchId;
    this.apiKey = config.wxpay.apiKey;
    this.notifyUrl = config.wxpay.notifyUrl;
    this.tradeType = config.wxpay.tradeType;
    this.unifiedOrderUrl = 'https://api.mch.weixin.qq.com/pay/unifiedorder';
  }

  // 生成随机字符串
  generateNonceStr() {
    return Math.random().toString(36).substr(2, 15);
  }

  // 生成签名
  generateSign(params) {
    // 1. 参数名ASCII码从小到大排序
    const sortedParams = Object.keys(params).sort().reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {});

    // 2. 拼接字符串
    let stringA = '';
    for (let k in sortedParams) {
      if (sortedParams[k]) {
        stringA += `${k}=${sortedParams[k]}&`;
      }
    }
    stringA += `key=${this.apiKey}`;

    // 3. MD5签名并转大写
    return crypto.createHash('md5').update(stringA).digest('hex').toUpperCase();
  }

  // 将对象转换为XML
  objectToXML(obj) {
    const builder = new xml2js.Builder({
      rootName: 'xml',
      headless: true
    });
    return builder.buildObject(obj);
  }

  // 将XML转换为对象
  async xmlToObject(xml) {
    return new Promise((resolve, reject) => {
      xml2js.parseString(xml, { trim: true }, (err, result) => {
        if (err) return reject(err);
        resolve(result.xml);
      });
    });
  }

  // 统一下单
  async unifiedOrder(orderData) {
    try {
      const params = {
        appid: config.wx.appId,
        mch_id: this.mchId,
        nonce_str: this.generateNonceStr(),
        body: orderData.body,
        out_trade_no: orderData.orderNo,
        total_fee: orderData.totalFee,
        spbill_create_ip: orderData.clientIp,
        notify_url: this.notifyUrl,
        trade_type: this.tradeType,
        openid: orderData.openid
      };

      // 生成签名
      params.sign = this.generateSign(params);

      // 将参数转换为XML
      const xmlData = this.objectToXML(params);

      // 请求统一下单接口
      const response = await axios.post(this.unifiedOrderUrl, xmlData, {
        headers: { 'Content-Type': 'text/xml' }
      });

      // 解析响应结果
      const result = await this.xmlToObject(response.data);
      logger.debug('统一下单响应:', result);

      if (result.return_code === 'SUCCESS' && result.result_code === 'SUCCESS') {
        // 生成小程序支付参数
        const payParams = {
          timeStamp: Math.floor(Date.now() / 1000).toString(),
          nonceStr: this.generateNonceStr(),
          package: `prepay_id=${result.prepay_id}`,
          signType: 'MD5'
        };

        payParams.paySign = this.generateSign({
          appId: config.wx.appId,
          timeStamp: payParams.timeStamp,
          nonceStr: payParams.nonceStr,
          package: payParams.package,
          signType: payParams.signType
        });

        return payParams;
      } else {
        throw new Error(result.return_msg || result.err_code_des || '下单失败');
      }
    } catch (error) {
      logger.error('统一下单失败:', error);
      throw error;
    }
  }
}

module.exports = new WXPay(); 