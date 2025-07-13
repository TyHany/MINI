const app = getApp();

Page({
  data: {
    banners: [
      { image_url: '/assets/icons/user-avatar.png' },
      { image_url: '/assets/icons/user-avatar.png' },
      { image_url: '/assets/icons/user-avatar.png' }
    ],
    categories: [
      { id: 1, name: '热门推荐', goods: [
        { id: 101, name: '商品一', image_url: '/assets/icons/user-avatar.png', price: '99.99' },
        { id: 102, name: '商品二', image_url: '/assets/icons/user-avatar.png', price: '199.00' },
        { id: 103, name: '商品三', image_url: '/assets/icons/user-avatar.png', price: '88.00' },
        { id: 104, name: '商品四', image_url: '/assets/icons/user-avatar.png', price: '29.90' }
      ]},
      { id: 2, name: '新品上市', goods: [
        { id: 201, name: '商品五', image_url: '/assets/icons/user-avatar.png', price: '599.00' },
        { id: 202, name: '商品六', image_url: '/assets/icons/user-avatar.png', price: '699.00' },
        { id: 203, name: '商品七', image_url: '/assets/icons/user-avatar.png', price: '799.00' },
        { id: 204, name: '商品八', image_url: '/assets/icons/user-avatar.png', price: '899.00' }
      ]}
    ],
    recommendGoods: [
      { id: 101, name: '推荐商品一', image_url: '/assets/icons/user-avatar.png', price: '99.99' },
      { id: 102, name: '推荐商品二', image_url: '/assets/icons/user-avatar.png', price: '199.00' },
      { id: 103, name: '推荐商品三', image_url: '/assets/icons/user-avatar.png', price: '88.00' },
      { id: 104, name: '推荐商品四', image_url: '/assets/icons/user-avatar.png', price: '29.90' }
    ]
  },

  onLoad() {
    // this.loadBanners();
    // this.loadRecommendGoods();
    // this.loadCategories();
  },

  // 加载轮播图
  loadBanners() {
    wx.request({
      url: `${app.globalData.baseUrl}/api/banner/list`,
      success: (res) => {
        if (res.data.code === 0) {
          this.setData({
            banners: res.data.data
          });
        }
      }
    });
  },

  // 加载推荐商品
  loadRecommendGoods() {
    wx.request({
      url: `${app.globalData.baseUrl}/api/goods/recommend`,
      success: (res) => {
        if (res.data.code === 0) {
          console.log('推荐商品数据:', res.data.data);
          this.setData({
            recommendGoods: res.data.data
          });
        }
      }
    });
  },

  // 加载分类和分类商品
  loadCategories() {
    wx.request({
      url: `${app.globalData.baseUrl}/api/category/list`,
      success: async (res) => {
        if (res.data.code === 0) {
          const categories = res.data.data;
          // 获取每个分类下的商品
          for (let category of categories) {
            const goodsRes = await this.loadCategoryGoods(category.id);
            category.goods = goodsRes.data.list || [];
          }
          this.setData({ categories });
        }
      }
    });
  },

  // 加载分类商品
  loadCategoryGoods(categoryId) {
    return new Promise((resolve) => {
      wx.request({
        url: `${app.globalData.baseUrl}/api/goods/list`,
        data: {
          categoryId,
          page: 1,
          pageSize: 4
        },
        success: (res) => {
          console.log('分类商品数据:', res.data);
          resolve(res.data);
        },
        fail: () => {
          resolve({ data: { list: [] } });
        }
      });
    });
  },

  // 搜索点击
  onSearchTap() {
    wx.navigateTo({
      url: '/pages/search/index'
    });
  },

  addToCart(e) {
    const product = e.currentTarget.dataset.product;
    // 调用全局购物车方法
    const app = getApp();
    app.addToCart(product);
    
    wx.showToast({
      title: '已加入购物车',
      icon: 'success'
    });
  },

  navigateToCategory(e) {
    const categoryId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/category/list/index?id=${categoryId}`
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