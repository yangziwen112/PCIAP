import { saveUser } from '../../utils/auth'

Page({
  data: {
    avatarUrl: '',
    nickname: '',
    canSubmit: false,
    redirect: '/pages/home/index',
    showManual: false,
    isWeChatLoading: false
  },
  onLoad(query) {
    if (query.redirect) this.setData({ redirect: decodeURIComponent(query.redirect) })
  },
  onChooseAvatar(e) {
    const url = e.detail.avatarUrl
    this.setData({ avatarUrl: url }, this.updateSubmit)
  },
  onInputName(e) {
    const nickname = (e.detail.value || '').trim()
    this.setData({ nickname }, this.updateSubmit)
  },
  updateSubmit() {
    this.setData({ canSubmit: !!(this.data.avatarUrl && this.data.nickname) })
  },
  onLogin() {
    if (!this.data.canSubmit) return
    saveUser({ avatarUrl: this.data.avatarUrl, nickname: this.data.nickname })
    wx.reLaunch({ url: this.data.redirect || '/pages/home/index' })
  },
  onWeChatLogin() {
    if (this.data.isWeChatLoading) return
    if (!wx.getUserProfile) {
      wx.showToast({ title: '当前基础库不支持微信一键登录', icon: 'none' })
      this.setData({ showManual: true })
      return
    }
    this.setData({ isWeChatLoading: true })
    wx.getUserProfile({
      desc: '用于完善个人资料',
      success: (res) => {
        const info = res.userInfo || {}
        const avatarUrl = info.avatarUrl || ''
        const nickname = info.nickName || ''
        if (avatarUrl && nickname) {
          saveUser({ avatarUrl, nickname })
          wx.reLaunch({ url: this.data.redirect || '/pages/home/index' })
          return
        }
        this.setData({ avatarUrl, nickname }, this.updateSubmit)
      },
      fail: () => {
        this.setData({ showManual: true })
        wx.showToast({ title: '已取消授权，可手动填写', icon: 'none' })
      },
      complete: () => {
        if (this.route) {
          this.setData({ isWeChatLoading: false })
        }
      }
    })
  }
}) 