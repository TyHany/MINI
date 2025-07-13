App({
  globalData: {
    userInfo: null,
    cartList: []
  },

  onLaunch() {
    // 尝试从本地缓存中恢复用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.globalData.userInfo = userInfo;
    }

    // 从本地存储加载购物车数据
    const cartList = wx.getStorageSync('cartList') || [];
    this.globalData.cartList = cartList;
  },

  // 添加到购物车
  addToCart(product) {
    const cartList = this.globalData.cartList;
    const existingItem = cartList.find(item => item.id === product.id);
    
    if (existingItem) {
      // 如果商品已存在，增加数量
      existingItem.num = (existingItem.num || 1) + 1;
    } else {
      // 如果商品不存在，添加到购物车
      cartList.push({
        ...product,
        num: 1,
        selected: true
      });
    }
    
    // 更新全局状态
    this.globalData.cartList = cartList;
    // 保存到本地存储
    wx.setStorageSync('cartList', cartList);
    
    // 更新购物车角标
    this.updateCartBadge();
  },

  // 从购物车移除
  removeFromCart(productId) {
    const cartList = this.globalData.cartList.filter(item => item.id !== productId);
    this.globalData.cartList = cartList;
    wx.setStorageSync('cartList', cartList);
    this.updateCartBadge();
  },

  // 更新购物车商品数量
  updateCartItemNum(productId, num) {
    const cartList = this.globalData.cartList;
    const item = cartList.find(item => item.id === productId);
    if (item) {
      item.num = num;
      if (num <= 0) {
        // 如果数量为0，从购物车移除
        this.removeFromCart(productId);
      } else {
        this.globalData.cartList = cartList;
        wx.setStorageSync('cartList', cartList);
      }
    }
    this.updateCartBadge();
  },

  // 更新购物车角标
  updateCartBadge() {
    const totalNum = this.globalData.cartList.reduce((sum, item) => sum + (item.num || 0), 0);
    if (totalNum > 0) {
      wx.setTabBarBadge({
        index: 2, // 购物车的 tabBar 索引
        text: totalNum.toString()
      });
    } else {
      wx.removeTabBarBadge({
        index: 2
      });
    }
  },

  // 清空购物车
  clearCart() {
    this.globalData.cartList = [];
    wx.setStorageSync('cartList', []);
    this.updateCartBadge();
  },

  // 获取购物车总数量
  getCartTotalNum() {
    return this.globalData.cartList.reduce((sum, item) => sum + (item.num || 0), 0);
  },

  // 获取购物车总价
  getCartTotalPrice() {
    return this.globalData.cartList.reduce((sum, item) => {
      if (item.selected) {
        return sum + (item.price * (item.num || 1));
      }
      return sum;
    }, 0);
  }
}) 