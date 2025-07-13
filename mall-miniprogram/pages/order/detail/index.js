const app = getApp();

Page({
  data: {
    orderId: null,
    orderDetail: null
  },

  onLoad(options) {
    this.setData({
      orderId: options.id
    });
    this.loadOrderDetail();
  },

  // 加载订单详情
  async loadOrderDetail() {
    try {
      wx.showLoading({
        title: '加载中...',
        mask: true
      });

      const res = await wx.request({
        url: `${app.globalData.baseUrl}/api/order/detail`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${wx.getStorageSync('token')}`
        },
        data: {
          orderId: this.data.orderId
        }
      });

      if (res.data.code === 0) {
        this.setData({
          orderDetail: res.data.data
        });
      } else {
        throw new Error(res.data.message);
      }
    } catch (error) {
      console.error('加载订单详情失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 调用支付
  async requestPayment(payParams) {
    return new Promise((resolve, reject) => {
      wx.requestPayment({
        timeStamp: payParams.timeStamp,
        nonceStr: payParams.nonceStr,
        package: payParams.package,
        signType: payParams.signType,
        paySign: payParams.paySign,
        success: resolve,
        fail: reject
      });
    });
  },

  // 支付订单
  async payOrder() {
    try {
      wx.showLoading({
        title: '正在支付...',
        mask: true
      });

      // 创建支付参数
      const payRes = await wx.request({
        url: `${app.globalData.baseUrl}/api/pay/create`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${wx.getStorageSync('token')}`
        },
        data: {
          orderId: this.data.orderId
        }
      });

      if (payRes.data.code === 0) {
        // 调用支付
        await this.requestPayment(payRes.data.data);
        
        wx.showToast({
          title: '支付成功',
          icon: 'success'
        });

        // 刷新订单状态
        this.loadOrderDetail();
      } else {
        throw new Error(payRes.data.message);
      }
    } catch (error) {
      console.error('支付失败:', error);
      wx.showToast({
        title: '支付失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  }
}); 