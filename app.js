App({
  onLaunch: function() {
    // 静默登录
    this.silentLogin()
  },

  silentLogin: function() {
    wx.login({
      success: (res) => {
        if (res.code) {
          // 将 code 发送到后端
          wx.request({
            url: 'your_api_url/login',
            data: {
              code: res.code
            },
            success: (response) => {
              // 保存后端返回的 token 等信息
              wx.setStorageSync('token', response.data.token)
            }
          })
        }
      }
    })
  }
}) 