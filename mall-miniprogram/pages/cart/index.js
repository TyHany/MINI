const app = getApp();

Page({
  data: {
    cartList: [],
    allSelected: false,
    totalPrice: 0,
    totalNum: 0,
    selectedCount: 0,
    address: null
  },

  onShow() {
    // 检查登录状态
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showModal({
        title: '提示',
        content: '请先登录',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({
              url: '/pages/user/index'
            });
          } else {
            wx.switchTab({
              url: '/pages/index/index'
            });
          }
        }
      });
      return;
    }

    this.loadCartList();
    this.loadAddress();
  },

  loadCartList() {
    const cartList = app.globalData.cartList || [];
    this.setData({ cartList });
    this.updateSelectedStatus();
  },

  // 切换单个商品选中状态
  toggleSelect(e) {
    const { index } = e.currentTarget.dataset;
    const { cartList } = this.data;
    cartList[index].selected = !cartList[index].selected;
    this.setData({ cartList });
    this.updateSelectedStatus();
  },

  // 切换全选状态
  toggleSelectAll() {
    const { cartList, allSelected } = this.data;
    const newAllSelected = !allSelected;
    cartList.forEach(item => {
      item.selected = newAllSelected;
    });
    this.setData({
      cartList,
      allSelected: newAllSelected
    });
    this.updateSelectedStatus();
  },

  // 更新选中状态和总价
  updateSelectedStatus() {
    const { cartList } = this.data;
    let totalPrice = 0;
    let selectedCount = 0;
    let allSelected = cartList.length > 0;  // 初始值改为 true，只有在有商品且有未选中时才设为 false

    cartList.forEach(item => {
      if (item.selected) {
        totalPrice += item.price * item.num;
        selectedCount += item.num;
      } else {
        allSelected = false;  // 只要有一个未选中就设为 false
      }
    });

    this.setData({
      allSelected,
      totalPrice: totalPrice.toFixed(2),  // 保留两位小数
      selectedCount
    });

    // 更新全局购物车数据
    app.globalData.cartList = cartList;
    wx.setStorageSync('cartList', cartList);
  },

  // 增加商品数量
  increaseNum(e) {
    const { index } = e.currentTarget.dataset;
    const { cartList } = this.data;
    cartList[index].num++;
    this.setData({ cartList });
    this.updateSelectedStatus();
    app.updateCartItemNum(cartList[index].id, cartList[index].num);
  },

  // 减少商品数量
  decreaseNum(e) {
    const { index } = e.currentTarget.dataset;
    const { cartList } = this.data;
    if (cartList[index].num <= 1) return;
    cartList[index].num--;
    this.setData({ cartList });
    this.updateSelectedStatus();
    app.updateCartItemNum(cartList[index].id, cartList[index].num);
  },

  // 删除商品
  deleteGoods(e) {
    const { index } = e.currentTarget.dataset;
    const { cartList } = this.data;
    wx.showModal({
      title: '提示',
      content: '确定要删除该商品吗？',
      success: (res) => {
        if (res.confirm) {
          app.removeFromCart(cartList[index].id);
          cartList.splice(index, 1);
          this.setData({ cartList });
          this.updateSelectedStatus();
        }
      }
    });
  },

  // 提交订单
  submitOrder() {
    const { selectedCount, totalPrice } = this.data;
    if (selectedCount === 0) {
      wx.showToast({
        title: '请选择要结算的商品',
        icon: 'none'
      });
      return;
    }
    
    // 获取选中的商品
    const selectedGoods = this.data.cartList.filter(item => item.selected);
    
    // 这里可以跳转到订单确认页面
    wx.navigateTo({
      url: '/pages/order/confirm/index'
    });
  },

  // 更新总价和选中数量
  updateTotalPrice() {
    const cartList = this.data.cartList;
    let totalPrice = 0;
    let selectedCount = 0;
    let allSelected = true;

    cartList.forEach(item => {
      if (item.selected) {
        totalPrice += item.price * item.num;
        selectedCount += item.num;
      } else {
        allSelected = false;
      }
    });

    this.setData({
      totalPrice: totalPrice.toFixed(2),
      selectedCount,
      allSelected
    });
  },

  // 加载默认地址
  async loadAddress() {
    try {
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: `${app.globalData.baseUrl}/api/address/default`,
          method: 'GET',
          header: {
            'Authorization': `Bearer ${wx.getStorageSync('token')}`
          },
          success: resolve,
          fail: reject
        });
      });

      if (res.statusCode === 200 && res.data.code === 0 && res.data.data) {
        this.setData({
          address: res.data.data
        });
      }
    } catch (error) {
      console.error('加载默认地址失败:', error);
      // 这里不显示错误提示，因为用户可以手动选择地址
    }
  },

  // 选择地址
  selectAddress() {
    wx.navigateTo({
      url: '/pages/address/list/index?select=true',
      events: {
        // 监听地址选择结果
        selectAddress: (address) => {
          this.setData({ address });
          // 如果选择了非默认地址，询问是否设为默认
          if (!address.is_default) {
            wx.showModal({
              title: '提示',
              content: '是否将该地址设为默认地址？',
              success: async (res) => {
                if (res.confirm) {
                  try {
                    const res = await new Promise((resolve, reject) => {
                      wx.request({
                        url: `${app.globalData.baseUrl}/api/address/set-default`,
                        method: 'POST',
                        header: {
                          'Authorization': `Bearer ${wx.getStorageSync('token')}`
                        },
                        data: { id: address.id },
                        success: resolve,
                        fail: reject
                      });
                    });

                    if (res.statusCode === 200 && res.data.code === 0) {
                      wx.showToast({
                        title: '设置成功',
                        icon: 'success'
                      });
                      // 更新地址的默认状态
                      address.is_default = 1;
                      this.setData({ address });
                    }
                  } catch (error) {
                    console.error('设置默认地址失败:', error);
                    wx.showToast({
                      title: '设置失败',
                      icon: 'none'
                    });
                  }
                }
              }
            });
          }
        }
      }
    });
  },

  // 修改结算方法
  async checkout() {
    try {
      // 获取选中的商品
      const selectedGoods = this.data.cartList.filter(item => item.selected);

      if (selectedGoods.length === 0) {  // 改为判断选中商品数组的长度
        wx.showToast({
          title: '请选择商品',
          icon: 'none'
        });
        return;
      }

      if (!this.data.address) {
        wx.showModal({
          title: '提示',
          content: '请选择收货地址',
          success: (res) => {
            if (res.confirm) {
              this.selectAddress();
            }
          }
        });
        return;
      }

      wx.showLoading({
        title: '正在创建订单...',
        mask: true
      });

      // 创建订单
      const orderRes = await new Promise((resolve, reject) => {
        wx.request({
          url: `${app.globalData.baseUrl}/api/order/create`,
          method: 'POST',
          header: {
            'Authorization': `Bearer ${wx.getStorageSync('token')}`
          },
          data: {
            goods: selectedGoods.map(item => ({
              goodsId: item.id,
              num: item.num
            })),
            addressId: this.data.address.id
          },
          success: resolve,
          fail: reject
        });
      });

      if (!(orderRes.statusCode === 200 && orderRes.data.code === 0)) {
        throw new Error(orderRes.data?.message || '创建订单失败');
      }

      const { orderId, orderNo } = orderRes.data.data;

      // 获取支付参数
      const payRes = await new Promise((resolve, reject) => {
        wx.request({
          url: `${app.globalData.baseUrl}/api/pay/create`,
          method: 'POST',
          header: {
            'Authorization': `Bearer ${wx.getStorageSync('token')}`
          },
          data: {
            orderNo
          },
          success: resolve,
          fail: reject
        });
      });

      if (!(payRes.statusCode === 200 && payRes.data.code === 0)) {
        throw new Error(payRes.data?.message || '获取支付参数失败');
      }

      // 调起微信支付
      const paymentData = {
        ...payRes.data.data,
        signType: 'MD5'
      };

      // 提前准备好新的购物车数据
      const newCartList = this.data.cartList.filter(item => !item.selected);

      wx.requestPayment({
        ...paymentData,
        success: (res) => {
          console.log('支付成功:', res);
        },
        fail: (err) => {
          console.log('支付失败或取消:', err);
        },
        complete: () => {
          // 无论成功失败，都进行跳转和清理操作
          // 更新购物车状态
          app.globalData.cartList = newCartList;
          wx.setStorageSync('cartList', newCartList);
          this.setData({ cartList: newCartList });
          this.updateTotalPrice();
          app.updateCartBadge();

          // 立即跳转
          wx.redirectTo({
            url: `/pages/order/detail/index?id=${orderId}`,
            complete: () => {
              wx.hideLoading();
            }
          });
        }
      });

      // 同时启动轮询订单状态
      this.pollOrderStatus(orderId);

    } catch (error) {
      console.error('结算失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: error.message || '支付失败',
        icon: 'none'
      });
    }
  },

  // 轮询订单状态
  async pollOrderStatus(orderId) {
    let retryCount = 0;
    const maxRetries = 10; // 最多轮询10次
    const interval = 1000; // 每秒轮询一次

    const checkStatus = async () => {
      try {
        const res = await new Promise((resolve, reject) => {
          wx.request({
            url: `${app.globalData.baseUrl}/api/order/status`,
            method: 'GET',
            header: {
              'Authorization': `Bearer ${wx.getStorageSync('token')}`
            },
            data: { orderId },
            success: resolve,
            fail: reject
          });
        });

        if (res.statusCode === 200 && res.data.code === 0) {
          const orderStatus = res.data.data.status;
          if (orderStatus === 1) { // 支付成功
            return true;
          }
        }

        retryCount++;
        if (retryCount < maxRetries) {
          setTimeout(checkStatus, interval);
        }
      } catch (error) {
        console.error('查询订单状态失败:', error);
      }
    };

    checkStatus();
  }
}); 