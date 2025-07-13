const app = getApp();

Page({
  data: {
    categoryId: null,
    products: []
  },
  
  onLoad(options) {
    const { id } = options;
    this.setData({ categoryId: id });
    this.loadCategoryProducts(id);
  },
  
  loadCategoryProducts(categoryId) {
    wx.request({
      url: `${app.globalData.baseUrl}/api/goods/list`,
      data: { 
        categoryId,
        page: 1,
        pageSize: 20
      },
      success: (res) => {
        console.log('分类商品列表数据:', res.data);
        if (res.data.code === 0) {
          this.setData({
            products: res.data.data.list
          });
        }
      }
    });
  },

  // 添加购物车方法
  addToCart(e) {
    const product = e.currentTarget.dataset.product;
    // 调用全局购物车方法
    app.addToCart(product);
    
    wx.showToast({
      title: '已加入购物车',
      icon: 'success'
    });
  },

  // 跳转到商品详情
  goToDetail(e) {
    const goodsId = e.currentTarget.dataset.id;
    console.log('点击商品:', {
      goodsId,
      currentTarget: e.currentTarget.dataset,
      item: e.currentTarget.dataset.item
    });
    
    if (!goodsId) {
      console.error('商品ID不存在');
      return;
    }
    
    wx.navigateTo({
      url: `/pages/goods/detail/index?id=${goodsId}`
    });
  }
}); 