const crypto = require('crypto');
const logger = require('./logger');
const xml2js = require('xml2js');

// XML转对象
function xmlToObject(xml) {
  return new Promise((resolve, reject) => {
    xml2js.parseString(xml, { trim: true, explicitArray: false }, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result.xml);
      }
    });
  });
}

// 解析微信支付回调数据
exports.parseNotifyData = async (req) => {
  try {
    // 获取原始XML数据
    let xmlData = '';
    for await (const chunk of req) {
      xmlData += chunk;
    }
    
    logger.info('收到的XML数据:', xmlData);

    // 解析XML数据
    const data = await xmlToObject(xmlData);
    
    logger.info('解析后的数据:', data);

    return data;  // 直接返回解析后的数据
  } catch (err) {
    logger.error('解析微信支付回调数据失败:', err);
    throw new Error('解析回调数据失败');
  }
};

// 验证签名 - 导出这个函数
exports.verifySignature = function(params, key) {
  // 1. 对所有参数按字典序排序
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

  logger.debug('计算的签名:', sign);
  logger.debug('收到的签名:', params.sign);

  return sign;
};

// 对象转XML
exports.objectToXml = function(obj) {
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
};

// 解密数据
function decrypt(ciphertext, nonce, associated_data) {
  // TODO: 实现解密逻辑
  return '{}';
} 