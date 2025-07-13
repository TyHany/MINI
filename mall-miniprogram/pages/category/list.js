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
    // 这里调用你的获取分类商品列表的接口
    wx.request({
      url: 'your_api_url/category/products',
      data: { categoryId },
      success: (res) => {
        this.setData({
          products: res.data.products
        });
      }
    });
  }
}); 