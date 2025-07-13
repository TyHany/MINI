const app = getApp();

Page({
  data: {
    userInfo: null,
    tempUserInfo: {
      avatar: '',
      nickname: ''
    }
  },

  onShow() {
    // 设置选中的 tab
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 3  // 3 是"我的"页面的索引
      });
    }
    this.updateUserInfo();
  },

  updateUserInfo() {
    const userInfo = app.globalData.userInfo;
    console.log('更新用户信息:', userInfo); // 添加调试日志
    this.setData({
      userInfo: userInfo
    }, () => {
      // 在状态更新完成后打印
      console.log('页面状态已更新:', this.data.userInfo);
    });
  },

  // 选择头像
  async onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    this.setData({
      'tempUserInfo.avatar': avatarUrl
    });
  },

  // 输入昵称
  onInputNickname(e) {
    this.setData({
      'tempUserInfo.nickname': e.detail.value
    });
  },

  // 保存用户信息（本地化改造）
  saveUserInfo() {
    const { tempUserInfo } = this.data;
    if (!tempUserInfo.avatar || !tempUserInfo.nickname) {
      wx.showToast({
        title: '请选择头像并输入昵称',
        icon: 'none'
      });
      return;
    }

    // 构造用户信息对象
    const userInfo = {
      avatar: tempUserInfo.avatar, // 直接使用本地临时路径
      nickname: tempUserInfo.nickname
    };

    // 保存到全局变量和本地缓存
    app.globalData.userInfo = userInfo;
    wx.setStorageSync('userInfo', userInfo);

    // 更新页面状态
    this.setData({
      userInfo: userInfo,
      tempUserInfo: {
        avatar: '',
        nickname: ''
      }
    });

    wx.showToast({
      title: '登录成功',
      icon: 'success'
    });
  },

  // 上传文件 (此功能已不再需要，但保留以备将来使用)
  uploadFile(filePath) {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: `${app.globalData.baseUrl}/api/upload`,
        filePath: filePath,
        name: 'file',
        header: {
          'Authorization': `Bearer ${wx.getStorageSync('token')}`
        },
        success: res => {
          try {
            const data = JSON.parse(res.data);
            if (data.code === 0) {
              resolve(data.data.url);
            } else {
              reject(new Error(data.message || '上传失败'));
            }
          } catch (error) {
            reject(new Error('解析上传响应失败'));
          }
        },
        fail: reject
      });
    });
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('userInfo'); // 清除本地缓存
          app.globalData.userInfo = null;
          this.setData({
            userInfo: null,
            tempUserInfo: {
              avatar: '',
              nickname: ''
            }
          });
        }
      }
    });
  },

  // 跳转到订单页面
  goToOrders() {
    if (!app.globalData.userInfo) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: '/pages/order/list/index'
    });
  },

  // 跳转到地址管理页面
  goToAddress() {
    if (!app.globalData.userInfo) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: '/pages/address/list/index'
    });
  },
}); 