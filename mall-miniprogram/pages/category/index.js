const app = getApp();

Page({
  data: {
    categories: [
      { id: 1, name: '电子产品', image_url: '/assets/icons/user-avatar.png' },
      { id: 2, name: '服饰鞋包', image_url: '/assets/icons/user-avatar.png' },
      { id: 3, name: '美妆护肤', image_url: '/assets/icons/user-avatar.png' },
      { id: 4, name: '家居生活', image_url: '/assets/icons/user-avatar.png' },
      { id: 5, name: '图书音像', image_url: '/assets/icons/user-avatar.png' }
    ],
    currentCategory: { id: 1, name: '电子产品', image_url: '/assets/icons/user-avatar.png' },
    goods: [
      { id: 101, name: '电子产品-1', image_url: '/assets/icons/user-avatar.png', price: '99.99' },
      { id: 102, name: '电子产品-2', image_url: '/assets/icons/user-avatar.png', price: '199.00' },
      { id: 103, name: '电子产品-3', image_url: '/assets/icons/user-avatar.png', price: '88.00' }
    ]
  },

  onShow() {
    // this.loadCategories();
  },

  loadCategories() {
    // ... existing code ...
  },

  loadCategoryGoods(categoryId) {
    // ... existing code ...
  },

  switchCategory(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      currentCategory: category
    });
    // this.loadCategoryGoods(category.id);
    // 模拟切换
    const newGoods = [
      { id: category.id * 100 + 1, name: `${category.name}-1`, image_url: '/assets/icons/user-avatar.png', price: '123.45' },
      { id: category.id * 100 + 2, name: `${category.name}-2`, image_url: '/assets/icons/user-avatar.png', price: '234.56' },
      { id: category.id * 100 + 3, name: `${category.name}-3`, image_url: '/assets/icons/user-avatar.png', price: '345.67' },
    ];
    this.setData({ goods: newGoods });
  },

  addToCart(e) {
    const product = e.currentTarget.dataset.product;
    app.addToCart(product);
    
    wx.showToast({
      title: '已加入购物车',
      icon: 'success'
    });
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/goods/detail/index?id=${id}`
    });
  }
}); 