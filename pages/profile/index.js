Page({
  data: {
    userInfo: null,
    hasUserInfo: false
  },

  // 获取用户信息
  getUserProfile() {
    wx.getUserProfile({
      desc: '用于完善会员资料', // 声明获取用户个人信息后的用途
      success: (res) => {
        const userInfo = res.userInfo
        
        // 将用户信息发送到后端保存
        wx.request({
          url: 'your_api_url/update_user_info',
          method: 'POST',
          header: {
            'Authorization': wx.getStorageSync('token')
          },
          data: {
            nickName: userInfo.nickName,
            avatarUrl: userInfo.avatarUrl,
            gender: userInfo.gender,
            // ... 其他信息
          },
          success: () => {
            this.setData({
              userInfo: userInfo,
              hasUserInfo: true
            })
          }
        })
      }
    })
  }
}) 