const app = getApp();

Page({
  data: {
    status: '', // 默认为空，显示全部订单
    orderList: [],
    pagination: {
      page: 1,
      pageSize: 10,
      total: 0
    }
  },

  onLoad(options) {
    // 如果有传入状态参数，则设置状态
    if (options.status) {
      this.setData({ status: options.status });
    }
    this.loadOrderList();
  },

  // 切换选项卡
  switchTab(e) {
    const status = e.currentTarget.dataset.status;
    this.setData({
      status,
      'pagination.page': 1 // 切换状态时重置页码
    });
    this.loadOrderList();
  },

  // 加载订单列表
  async loadOrderList() {
    try {
      wx.showLoading({
        title: '加载中...',
        mask: true
      });

      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: `${app.globalData.baseUrl}/api/order/list`,
          method: 'GET',
          header: {
            'Authorization': `Bearer ${wx.getStorageSync('token')}`
          },
          data: {
            status: this.data.status,
            page: this.data.pagination.page,
            pageSize: this.data.pagination.pageSize
          },
          success: resolve,
          fail: reject
        });
      });

      wx.hideLoading();

      if (res.statusCode === 200 && res.data.code === 0) {
        this.setData({
          orderList: res.data.data.list,
          pagination: res.data.data.pagination
        });
      } else {
        throw new Error(res.data?.message || '加载失败');
      }
    } catch (error) {
      console.error('加载订单列表失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      });
    }
  },

  // 取消订单
  async cancelOrder(e) {
    try {
      const orderId = e.currentTarget.dataset.id;
      const res = await new Promise((resolve) => {
        wx.showModal({
          title: '提示',
          content: '确定要取消该订单吗？',
          success: resolve
        });
      });

      if (!res.confirm) return;

      wx.showLoading({
        title: '取消中...',
        mask: true
      });

      const cancelRes = await new Promise((resolve, reject) => {
        wx.request({
          url: `${app.globalData.baseUrl}/api/order/cancel`,
          method: 'POST',
          header: {
            'Authorization': `Bearer ${wx.getStorageSync('token')}`
          },
          data: { id: orderId },
          success: resolve,
          fail: reject
        });
      });

      wx.hideLoading();

      if (cancelRes.statusCode === 200 && cancelRes.data.code === 0) {
        wx.showToast({
          title: '取消成功',
          icon: 'success'
        });
        this.loadOrderList();
      } else {
        throw new Error(cancelRes.data?.message || '取消失败');
      }
    } catch (error) {
      console.error('取消订单失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: error.message || '取消失败',
        icon: 'none'
      });
    }
  },

  // 确认收货
  confirmReceive(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '提示',
      content: '确认已收到商品？',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: `${app.globalData.baseUrl}/api/order/confirm`,
            method: 'POST',
            header: {
              'Authorization': `Bearer ${wx.getStorageSync('token')}`
            },
            data: { id: orderId },
            success: (res) => {
              if (res.data.code === 200) {
                wx.showToast({
                  title: '确认成功',
                  icon: 'success'
                });
                this.loadOrderList();
              }
            }
          });
        }
      }
    });
  },

  // 去支付
  async goPay(e) {
    try {
      const orderId = e.currentTarget.dataset.id;
      
      // 先获取订单信息
      const orderRes = await new Promise((resolve, reject) => {
        wx.request({
          url: `${app.globalData.baseUrl}/api/order/detail`,
          method: 'GET',
          header: {
            'Authorization': `Bearer ${wx.getStorageSync('token')}`
          },
          data: { id: orderId },
          success: resolve,
          fail: reject
        });
      });

      if (!(orderRes.statusCode === 200 && orderRes.data.code === 0)) {
        throw new Error(orderRes.data?.message || '获取订单信息失败');
      }

      const { order_no } = orderRes.data.data;
      
      wx.showLoading({
        title: '获取支付参数...',
        mask: true
      });

      // 获取支付参数
      const payRes = await new Promise((resolve, reject) => {
        wx.request({
          url: `${app.globalData.baseUrl}/api/pay/create`,
          method: 'POST',
          header: {
            'Authorization': `Bearer ${wx.getStorageSync('token')}`
          },
          data: {
            orderNo: order_no
          },
          success: resolve,
          fail: reject
        });
      });

      wx.hideLoading();

      // 检查是否订单已支付
      if (payRes.data.code === 0 && payRes.data.message === '订单已支付') {
        wx.showToast({
          title: '支付成功',
          icon: 'success'
        });
        // 重新加载订单列表
        this.loadOrderList();
        return;
      }

      if (!(payRes.statusCode === 200 && payRes.data.code === 0)) {
        throw new Error(payRes.data?.message || '获取支付参数失败');
      }

      // 调起微信支付
      const paymentData = {
        ...payRes.data.data,
        signType: 'MD5'
      };

      await new Promise((resolve, reject) => {
        wx.requestPayment({
          ...paymentData,
          success: (res) => {
            console.log('支付成功:', res);
            resolve(res);
          },
          fail: (err) => {
            console.log('支付失败或取消:', err);
            reject(err);
          }
        });
      });

      // 支付成功后
      wx.showToast({
        title: '支付成功',
        icon: 'success'
      });

      // 重新加载订单列表
      this.loadOrderList();

    } catch (error) {
      console.error('支付失败:', error);
      wx.hideLoading();
      
      if (error.errMsg === 'requestPayment:fail cancel') {
        wx.showToast({
          title: '取消支付',
          icon: 'none'
        });
      } else {
        wx.showToast({
          title: error.message || '支付失败',
          icon: 'none'
        });
      }
    }
  },

  // 查看订单详情
  goToDetail(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/order/detail/index?id=${orderId}`
    });
  }
}); 