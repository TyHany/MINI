const db = require('../database');
const logger = require('../utils/logger');
const config = require('../config');
const crypto = require('crypto');
const axios = require('axios');
const wechatpay = require('../utils/wechatpay');

// 创建支付订单
exports.create = async (req, res) => {
  try {
    const { orderNo } = req.body;
    const userId = req.user.id;

    logger.debug('创建支付请求:', { 
      orderNo, 
      userId
    });

    // 查询订单信息和用户openid
    const [orders] = await db.execute(
      `SELECT o.*, u.openid 
       FROM orders o 
       LEFT JOIN user u ON o.user_id = u.id 
       WHERE o.order_no = ? AND o.user_id = ?`,
      [orderNo, userId]
    );

    if (orders.length === 0) {
      throw new Error('订单不存在');
    }

    const order = orders[0];

    // 检查订单状态
    if (order.status !== 0) {
      logger.info('订单状态不是待支付:', {
        orderNo,
        status: order.status
      });
      
      // 如果订单已支付，直接返回支付成功状态
      if (order.status >= 1) {
        return res.json({
          code: 0,
          message: '订单已支付',
          data: {
            status: order.status,
            isPaid: true
          }
        });
      }

      const statusMap = {
        1: '订单已支付',
        2: '订单已发货',
        3: '订单已完成',
        4: '订单已取消'
      };
      throw new Error(statusMap[order.status] || '订单状态不正确');
    }

    if (!order.openid) {
      throw new Error('用户openid不存在');
    }

    logger.info('订单信息:', {
      orderNo: order.order_no,
      totalAmount: order.total_amount,
      openidLength: order.openid?.length
    });

    // 调用统一下单接口
    try {
      const unifiedOrderResult = await createUnifiedOrder({
        body: '商城订单',
        outTradeNo: orderNo,
        totalFee: Math.round(order.total_amount * 100),
        openid: order.openid
      });

      // 生成支付参数
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const nonceStr = Math.random().toString(36).substr(2, 15);
      
      // 组装支付参数
      const params = {
        appId: process.env.WX_APP_ID,
        timeStamp: timestamp,
        nonceStr: nonceStr,
        package: `prepay_id=${unifiedOrderResult.prepay_id}`,
        signType: 'MD5'
      };

      logger.debug('生成支付参数:', {
        ...params,
        prepay_id: unifiedOrderResult.prepay_id
      });

      // 生成签名
      const paySign = generateSign(params, process.env.WX_PAY_KEY);

      // 返回支付参数
      res.json({
        code: 0,
        data: {
          ...params,
          paySign
        }
      });
    } catch (error) {
      // 如果是订单已支付的错误，返回成功状态
      if (error.message === 'ORDER_PAID') {
        logger.info('订单已完成支付，返回成功状态');
        return res.json({
          code: 0,
          message: '订单已支付',
          data: {
            status: 1,
            isPaid: true
          }
        });
      }
      // 其他错误继续抛出
      throw error;
    }
  } catch (error) {
    logger.error('创建支付失败:', error);
    // 如果是已知的业务错误，返回400状态码
    if (error.message.includes('订单不存在') || 
        error.message.includes('订单状态') || 
        error.message.includes('openid不存在')) {
      return res.status(400).json({
        code: 400,
        message: error.message
      });
    }
    // 其他错误返回500状态码
    res.status(500).json({
      code: 500,
      message: error.message || '创建支付失败'
    });
  }
};

// 调用统一下单接口
async function createUnifiedOrder(params) {
  const url = 'https://api.mch.weixin.qq.com/pay/unifiedorder';
  const nonce_str = Math.random().toString(36).substr(2, 15);
  
  // 确保total_fee是整数
  const totalFee = Math.round(params.totalFee);
  if (!totalFee || totalFee <= 0) {
    throw new Error('订单金额必须大于0');
  }

  logger.info('订单支付金额:', {
    original: params.totalFee,
    rounded: totalFee
  });
  
  const data = {
    appid: process.env.WX_APP_ID,         // 小程序ID
    mch_id: process.env.WX_MCH_ID,        // 商户号
    nonce_str,                            // 随机字符串
    sign_type: 'MD5',                     // 签名类型
    body: params.body,                    // 商品描述
    out_trade_no: params.outTradeNo,      // 商户订单号
    total_fee: totalFee,                  // 订单金额（分）
    spbill_create_ip: '127.0.0.1',        // 终端IP
    notify_url: process.env.WX_NOTIFY_URL, // 通知地址
    trade_type: 'JSAPI',                  // 交易类型
    openid: params.openid                 // 用户标识
  };

  // 检查必要参数
  const requiredParams = ['appid', 'mch_id', 'nonce_str', 'body', 'out_trade_no', 'total_fee', 'notify_url', 'trade_type', 'openid'];
  for (const param of requiredParams) {
    if (!data[param]) {
      logger.error('缺少必要参数:', {
        param,
        value: data[param]
      });
      throw new Error(`缺少必要参数: ${param}`);
    }
  }

  logger.debug('统一下单请求参数:', {
    ...data,
    sign: '***',
    openidLength: params.openid?.length,
    totalFeeType: typeof data.total_fee
  });

  // 生成签名 - 使用支付密钥
  data.sign = generateSign(data, process.env.WX_PAY_KEY);

  // 将对象转换为XML
  const xmlData = objectToXml(data);

  try {
    logger.debug('统一下单请求数据:', { 
      url,
      data: { ...data, sign: '***' }, // 隐藏签名
      xmlData
    });

    const response = await axios.post(url, xmlData, {
      headers: { 'Content-Type': 'text/xml' }
    });

    logger.debug('统一下单响应数据:', { 
      status: response.status,
      data: response.data
    });

    // 将XML响应转换为对象
    const result = await xmlToObject(response.data);

    logger.debug('统一下单解析结果:', result);

    if (result.return_code === 'SUCCESS') {
      if (result.result_code === 'SUCCESS') {
        return result;
      } else {
        // 如果订单已支付
        if (result.err_code === 'ORDERPAID') {
          logger.info('微信支付返回订单已支付，更新本地订单状态');
          // 更新本地订单状态
          await db.execute(
            `UPDATE orders SET 
              status = 1,
              pay_time = CURRENT_TIMESTAMP
            WHERE order_no = ? AND status = 0`,
            [params.outTradeNo]
          );
          throw new Error('ORDER_PAID');
        }
        
        // 如果是订单号重复，尝试查询订单状态
        if (result.err_code === '201' || result.err_code === 'INVALID_REQUEST') {
          logger.info('检测到订单号重复，开始查询订单状态:', params.outTradeNo);
          
          // 查询订单状态
          const queryUrl = 'https://api.mch.weixin.qq.com/pay/orderquery';
          const queryData = {
            appid: process.env.WX_APP_ID,
            mch_id: process.env.WX_MCH_ID,
            out_trade_no: params.outTradeNo,
            nonce_str: Math.random().toString(36).substr(2, 15),
            sign_type: 'MD5'
          };
          
          logger.debug('订单查询请求参数:', {
            ...queryData,
            sign: '***'
          });
          
          queryData.sign = generateSign(queryData, process.env.WX_PAY_KEY);
          const queryXmlData = objectToXml(queryData);
          
          logger.debug('订单查询请求XML:', queryXmlData);
          
          const queryResponse = await axios.post(queryUrl, queryXmlData, {
            headers: { 'Content-Type': 'text/xml' }
          });
          
          logger.debug('订单查询响应数据:', {
            status: queryResponse.status,
            data: queryResponse.data
          });
          
          const queryResult = await xmlToObject(queryResponse.data);
          
          logger.info('订单查询结果:', {
            return_code: queryResult.return_code,
            result_code: queryResult.result_code,
            trade_state: queryResult.trade_state,
            out_trade_no: queryResult.out_trade_no,
            transaction_id: queryResult.transaction_id
          });
          
          // 如果订单已支付
          if (queryResult.return_code === 'SUCCESS' && 
              queryResult.result_code === 'SUCCESS' && 
              queryResult.trade_state === 'SUCCESS') {
            logger.info('订单已支付成功，更新本地订单状态');
            // 更新本地订单状态
            await db.execute(
              `UPDATE orders SET 
                status = 1,
                pay_time = CURRENT_TIMESTAMP,
                transaction_id = ?
              WHERE order_no = ? AND status = 0`,
              [queryResult.transaction_id, params.outTradeNo]
            );
            throw new Error('ORDER_PAID');
          }
          
          // 如果订单未支付，返回支付参数
          if (queryResult.trade_state === 'NOTPAY') {
            logger.info('订单未支付，返回支付参数');
            
            // 直接返回一个成功的结果，包含必要的支付信息
            return {
              return_code: 'SUCCESS',
              result_code: 'SUCCESS',
              prepay_id: queryResult.prepay_id || result.prepay_id, // 使用查询结果中的prepay_id或原始prepay_id
              trade_type: 'JSAPI'
            };
          }
          
          logger.warn('订单状态未知:', queryResult);
        }
        throw new Error(`业务失败: ${result.err_code} ${result.err_code_des || result.err_code}`);
      }
    } else {
      throw new Error(`通信失败: ${result.return_msg}`);
    }
  } catch (error) {
    if (error.message === 'ORDER_PAID') {
      throw error; // 直接抛出错误，让上层处理
    }
    if (error.response) {
      // 请求已发出，但服务器响应状态码不在 2xx 范围内
      logger.error('统一下单HTTP错误:', {
        status: error.response.status,
        data: error.response.data
      });
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      logger.error('统一下单网络错误:', error.request);
    } else {
      // 请求配置时出错
      logger.error('统一下单配置错误:', error.message);
    }
    throw error;
  }
}

// 对象转XML
function objectToXml(obj) {
  let xml = '<xml>';
  for (let key in obj) {
    if (typeof obj[key] === 'number') {
      xml += `<${key}>${obj[key]}</${key}>`;
    } else {
      xml += `<${key}><![CDATA[${obj[key]}]]></${key}>`;
    }
  }
  xml += '</xml>';
  return xml;
}

// XML转对象
function xmlToObject(xml) {
  return new Promise((resolve, reject) => {
    const parseString = require('xml2js').parseString;
    parseString(xml, { trim: true, explicitArray: false }, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result.xml);
      }
    });
  });
}

// 微信支付回调通知
exports.notify = async (req, res) => {
  logger.info('\n-------------------------------------------------------------');
  logger.info('接口名：微信支付回调通知');
  logger.info(`接口地址：${req.protocol}://${req.get('host')}${req.originalUrl}`);
  logger.info('请求头：', req.headers);

  try {
    // 解析回调数据
    const result = await wechatpay.parseNotifyData(req);
    logger.info('请求参数：', result);

    // 验证签名
    const calculatedSign = wechatpay.verifySignature(result, process.env.WX_PAY_KEY);
    if (calculatedSign !== result.sign) {
      logger.error('签名验证失败:', {
        calculated: calculatedSign,
        received: result.sign
      });
      throw new Error('签名验证失败');
    }

    // 验证支付结果
    if (result.return_code === 'SUCCESS' && result.result_code === 'SUCCESS') {
      // 更新订单状态
      await db.execute(
        `UPDATE orders SET 
          status = 1,
          pay_time = CURRENT_TIMESTAMP,
          transaction_id = ?
        WHERE order_no = ? AND status = 0`,
        [result.transaction_id, result.out_trade_no]
      );

      const response = wechatpay.objectToXml({
        return_code: 'SUCCESS',
        return_msg: 'OK'
      });
      
      logger.info('返回结果：', response);
      logger.info('-------------------------------------------------------------\n');
      
      res.type('xml');
      return res.send(response);
    }

    throw new Error('支付结果验证失败');
  } catch (err) {
    const response = wechatpay.objectToXml({
      return_code: 'FAIL',
      return_msg: err.message
    });
    
    logger.error('微信支付回调处理失败:', err);
    logger.info('返回结果：', response);
    logger.info('-------------------------------------------------------------\n');
    
    res.type('xml');
    res.send(response);
  }
};

// 生成签名
function generateSign(params, key) {
  // 1. 对所有参数按字典序排序，过滤空值和签名参数
  const sortedParams = Object.keys(params)
    .filter(key => params[key] !== '' && params[key] != null && key !== 'sign' && key !== 'key')
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');

  // 2. 拼接商户密钥
  const stringSignTemp = `${sortedParams}&key=${key}`;

  logger.debug('签名原文:', stringSignTemp);

  // 3. MD5加密并转大写
  const sign = crypto
    .createHash('md5')
    .update(stringSignTemp)
    .digest('hex')
    .toUpperCase();

  logger.debug('生成签名:', sign);

  return sign;
}

// 查询订单支付状态
exports.queryOrderStatus = async (req, res) => {
  try {
    const { orderNo } = req.query;
    const userId = req.user.id;

    logger.debug('查询支付状态:', { orderNo, userId });

    // 查询订单信息
    const [orders] = await db.execute(
      'SELECT * FROM orders WHERE order_no = ? AND user_id = ?',
      [orderNo, userId]
    );

    if (orders.length === 0) {
      throw new Error('订单不存在');
    }

    const order = orders[0];

    // 如果订单已经是支付状态，直接返回
    if (order.status !== 0) {
      return res.json({
        code: 0,
        data: {
          status: order.status,
          isPaid: order.status >= 1
        }
      });
    }

    // 调用微信支付查询接口
    const url = 'https://api.mch.weixin.qq.com/pay/orderquery';
    const nonce_str = Math.random().toString(36).substr(2, 15);
    
    const data = {
      appid: process.env.WX_APP_ID,
      mch_id: process.env.WX_MCH_ID,
      out_trade_no: orderNo,
      nonce_str,
      sign_type: 'MD5'
    };

    // 生成签名
    data.sign = generateSign(data, process.env.WX_PAY_KEY);

    // 将对象转换为XML
    const xmlData = objectToXml(data);

    const response = await axios.post(url, xmlData, {
      headers: { 'Content-Type': 'text/xml' }
    });

    // 将XML响应转换为对象
    const result = await xmlToObject(response.data);

    logger.debug('查询支付状态响应:', result);

    if (result.return_code === 'SUCCESS' && result.result_code === 'SUCCESS') {
      // 如果订单已支付
      if (result.trade_state === 'SUCCESS') {
        // 更新订单状态
        await db.execute(
          `UPDATE orders SET 
            status = 1,
            pay_time = CURRENT_TIMESTAMP,
            transaction_id = ?
          WHERE order_no = ? AND status = 0`,
          [result.transaction_id, orderNo]
        );

        return res.json({
          code: 0,
          data: {
            status: 1,
            isPaid: true
          }
        });
      }
    }

    // 订单未支付
    res.json({
      code: 0,
      data: {
        status: order.status,
        isPaid: false
      }
    });
  } catch (error) {
    logger.error('查询支付状态失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '查询支付状态失败'
    });
  }
}; 