import { getUser, clearUser } from '../../utils/auth'

Page({
  data: {
    user: {}
  },
  
  onShow() {
    const user = getUser()
    this.setData({ user: user || {} })
    console.log('个人中心用户信息:', user)
  },
  
  onGoLogin() {
    wx.reLaunch({ url: '/pages/auth-login/index' })
  },
  
  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      confirmColor: '#667eea',
      success: (res) => {
        if (res.confirm) {
          // 清除用户信息
          clearUser()
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          })
          
          // 跳转到登录页
          setTimeout(() => {
            wx.reLaunch({ url: '/pages/auth-login/index' })
          }, 1000)
        }
      }
    })
  }
}) 