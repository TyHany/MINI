Component({
  data: {
    selected: 0,
    color: "#999999",
    selectedColor: "#E93B3D",
    list: [
      {
        pagePath: "/pages/index/index",
        text: "首页",
        iconPath: "/assets/icons/home.png",
        selectedIconPath: "/assets/icons/home-active.png"
      },
      {
        pagePath: "/pages/category/index",
        text: "分类",
        iconPath: "/assets/icons/category.png",
        selectedIconPath: "/assets/icons/category-active.png"
      },
      {
        pagePath: "/pages/cart/index",
        text: "购物车",
        iconPath: "/assets/icons/cart.png",
        selectedIconPath: "/assets/icons/cart-active.png"
      },
      {
        pagePath: "/pages/user/index",
        text: "我的",
        iconPath: "/assets/icons/user.png",
        selectedIconPath: "/assets/icons/user-active.png"
      }
    ]
  },

  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset;
      const url = data.path;
      wx.switchTab({
        url,
        success: () => {
          const index = this.data.list.findIndex(item => item.pagePath === url);
          this.setData({
            selected: index
          });
        }
      });
    }
  }
}); 