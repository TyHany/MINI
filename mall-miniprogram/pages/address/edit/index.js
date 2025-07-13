const app = getApp();

Page({
  data: {
    id: '',
    receiverName: '',
    receiverPhone: '',
    region: ['', '', ''],
    detailAddress: '',
    isDefault: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ id: options.id });
      this.loadAddress(options.id);
    }
  },

  // 加载地址详情
  async loadAddress(id) {
    try {
      wx.showLoading({
        title: '加载中...',
        mask: true
      });

      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: `${app.globalData.baseUrl}/api/address/detail`,
          method: 'GET',
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
        const address = res.data.data;
        this.setData({
          receiverName: address.receiver_name,
          receiverPhone: address.receiver_phone,
          region: [address.province, address.city, address.district],
          detailAddress: address.detail_address,
          isDefault: address.is_default === 1
        });
      } else {
        throw new Error(res.data?.message || '加载失败');
      }
    } catch (error) {
      console.error('加载地址详情失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      });
      // 加载失败返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  // 输入框变化处理
  onInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [field]: e.detail.value
    });
  },

  // 地区选择器变化
  bindRegionChange(e) {
    this.setData({
      region: e.detail.value
    });
  },

  // 默认地址开关
  switchDefault(e) {
    this.setData({
      isDefault: e.detail.value
    });
  },

  // 保存地址
  async saveAddress() {
    try {
      // 表单验证
      if (!this.data.receiverName) {
        throw new Error('请输入收货人姓名');
      }
      if (!this.data.receiverPhone) {
        throw new Error('请输入手机号码');
      }
      if (!this.data.region[0] || !this.data.region[1] || !this.data.region[2]) {
        throw new Error('请选择所在地区');
      }
      if (!this.data.detailAddress) {
        throw new Error('请输入详细地址');
      }

      // 手机号码格式验证
      const phoneReg = /^1[3-9]\d{9}$/;
      if (!phoneReg.test(this.data.receiverPhone)) {
        throw new Error('手机号码格式不正确');
      }

      wx.showLoading({
        title: '保存中...',
        mask: true
      });

      const url = this.data.id ? 
        `${app.globalData.baseUrl}/api/address/update` : 
        `${app.globalData.baseUrl}/api/address/create`;

      const res = await new Promise((resolve, reject) => {
        wx.request({
          url,
          method: 'POST',
          header: {
            'Authorization': `Bearer ${wx.getStorageSync('token')}`
          },
          data: {
            id: this.data.id,
            receiverName: this.data.receiverName,
            receiverPhone: this.data.receiverPhone,
            province: this.data.region[0],
            city: this.data.region[1],
            district: this.data.region[2],
            detailAddress: this.data.detailAddress,
            isDefault: this.data.isDefault ? 1 : 0
          },
          success: resolve,
          fail: reject
        });
      });

      wx.hideLoading();

      if (res.statusCode === 200 && res.data.code === 0) {
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        throw new Error(res.data?.message || '保存失败');
      }
    } catch (error) {
      console.error('保存地址失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: error.message,
        icon: 'none'
      });
    }
  }
}); 