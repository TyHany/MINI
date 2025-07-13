const app = getApp();

Page({
  data: {
    goods: null,
    cartCount: 0,
    currentSwiperIndex: 0
  },

  onLoad(options) {
    const { id } = options;
    // this.loadGoodsDetail(id);
    this.setData({
      goods: {
        id: id || 1,
        name: '一个很棒的商品',
        price: '998.00',
        detail: '这是一个商品的详细描述，品质上乘，值得拥有。',
        image_url: '/assets/icons/user-avatar.png',
        // 假设轮播图也用这个头像
        banner_images: [
          { image_url: '/assets/icons/user-avatar.png' },
          { image_url: '/assets/icons/user-avatar.png' },
          { image_url: '/assets/icons/user-avatar.png' }
        ]
      }
    });
  },

  loadGoodsDetail(id) {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });

    wx.request({
      url: `${app.globalData.baseUrl}/api/goods/detail`,
      method: 'GET',
      data: { id },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 0) {
          this.setData({
            goods: res.data.data
          });
        } else {
          wx.showToast({
            title: '获取商品详情失败',
            icon: 'none'
          });
        }
      },
      fail: (error) => {
        console.error('获取商品详情失败:', error);
        wx.showToast({
          title: '获取商品详情失败',
          icon: 'none'
        });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  goToCart() {
    wx.switchTab({
      url: '/pages/cart/index'
    });
  },

  addToCart() {
    // TODO: 实现加入购物车功能
    wx.showToast({
      title: '加入购物车成功',
      icon: 'success'
    });
  },

  buyNow() {
    // TODO: 实现立即购买功能
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  }
}); 