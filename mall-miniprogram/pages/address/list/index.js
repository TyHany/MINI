const app = getApp();

Page({
  data: {
    addressList: [],
    isSelectMode: false  // 是否是选择地址模式
  },

  onLoad(options) {
    // 判断是否是选择地址模式
    this.setData({
      isSelectMode: options.select === 'true'
    });
  },

  onShow() {
    this.loadAddressList();
  },

  // 加载地址列表
  async loadAddressList() {
    try {
      wx.showLoading({
        title: '加载中...',
        mask: true
      });

      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: `${app.globalData.baseUrl}/api/address/list`,
          method: 'GET',
          header: {
            'Authorization': `Bearer ${wx.getStorageSync('token')}`
          },
          success: resolve,
          fail: reject
        });
      });

      wx.hideLoading();

      if (res.statusCode === 200 && res.data.code === 0) {
        this.setData({
          addressList: res.data.data
        });
      } else {
        throw new Error(res.data?.message || '加载失败');
      }
    } catch (error) {
      console.error('加载地址列表失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      });
    }
  },

  // 点击地址项
  handleAddressClick(e) {
    const { index } = e.currentTarget.dataset;
    const address = this.data.addressList[index];

    if (this.data.isSelectMode) {
      // 选择地址模式：选中地址并返回
      const eventChannel = this.getOpenerEventChannel();
      eventChannel.emit('selectAddress', address);
      wx.navigateBack();
    }
    // 移除非选择模式下的点击跳转
  },

  // 添加新地址
  addAddress() {
    wx.navigateTo({
      url: '/pages/address/edit/index'
    });
  },

  // 编辑地址
  editAddress(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/address/edit/index?id=${id}`
    });
  },

  // 删除地址
  deleteAddress(e) {
    const address = e.currentTarget.dataset.address;
    wx.showModal({
      title: '提示',
      content: '确定要删除该地址吗？',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: `${app.globalData.baseUrl}/api/address/delete`,
            method: 'POST',
            header: {
              'Authorization': `Bearer ${wx.getStorageSync('token')}`
            },
            data: {
              id: address.id
            },
            success: (res) => {
              if (res.data.code === 200) {
                wx.showToast({
                  title: '删除成功',
                  icon: 'success'
                });
                this.loadAddressList();
              }
            }
          });
        }
      }
    });
  },

  // 设为默认地址
  async setDefault(e) {
    try {
      const { id } = e.currentTarget.dataset;

      wx.showLoading({
        title: '设置中...',
        mask: true
      });

      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: `${app.globalData.baseUrl}/api/address/set-default`,
          method: 'POST',
          header: {
            'Authorization': `Bearer ${wx.getStorageSync('token')}`
          },
          data: { id },
          success: resolve,
          fail: reject
        });
      });

      wx.hideLoading();

      if (res.statusCode === 200 && res.data.code === 0) {
        wx.showToast({
          title: '设置成功',
          icon: 'success'
        });
        // 重新加载地址列表
        this.loadAddressList();
      } else {
        throw new Error(res.data?.message || '设置失败');
      }
    } catch (error) {
      console.error('设置默认地址失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: error.message || '设置失败',
        icon: 'none'
      });
    }
  }
}); 