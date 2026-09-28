import { callApi, toast } from '../../utils/request'
import { isLoggedIn, getUserId, promptLogin } from '../../utils/auth'
const { normalizeParticipant } = require('../../utils/user-display')

Page({
  data: {
    keyword: '',
    users: [],
    posts: [],
    loading: false
  },

  onInputChange(e) {
    this.setData({ keyword: e.detail.value })
  },

  clearInput() {
    this.setData({ keyword: '' })
  },

  cancel() {
    wx.navigateBack()
  },

  async search() {
    const keyword = this.data.keyword.trim()
    if (!keyword) return

    this.setData({ loading: true })
    
    try {
      const [userRes, postRes] = await Promise.all([
        isLoggedIn() ? callApi('friends/search', { keyword }) : Promise.resolve({ users: [] }),
        callApi('campus/posts/search', { keyword })
      ])
      
      const users = (userRes.users || []).map(item => {
        const participant = normalizeParticipant(item)
        return { ...participant, displayInitial: String(participant.displayName || '用户').slice(0, 1) }
      })
      const posts = (postRes.list || []).map(item => ({
        ...item,
        authorInitial: item.authorInitial || String(item.authorName || '用户').slice(0, 1)
      }))
      this.setData({
        users,
        posts,
        loading: false
      })
    } catch (error) {
      console.error('搜索失败:', error)
      toast('搜索失败，请重试')
      this.setData({ loading: false })
    }
  },

  goToUserProfile(e) {
    const { userId, userName } = e.currentTarget.dataset
    wx.showActionSheet({
      itemList: ['发起私信', '添加好友'],
      success: ({ tapIndex }) => {
        if (tapIndex === 0) return this.sendMessage({ currentTarget: { dataset: { userId, userName } } })
        if (tapIndex === 1) return this.sendFriendRequest({ currentTarget: { dataset: { userId, userName } } })
      }
    })
  },

  goToPostDetail(e) {
    const postId = e.currentTarget.dataset.postId
    wx.navigateTo({
      url: `/pages/campus-wall/detail?id=${postId}`
    })
  },

  async sendMessage(e) {
    const { userId, userName } = e.currentTarget.dataset
    
    if (!isLoggedIn()) {
      await promptLogin({ content: '登录后可以给同学发送私信。' })
      return
    }

    // 检查用户是否允许陌生人私信
    try {
      const res = await callApi('user/getSettings', { userId })
      
      if (res.data && res.data.allowStrangerMessages === false) {
        toast('该用户不允许陌生人私信')
        return
      }
      
      // 跳转到聊天页面
      wx.navigateTo({
        url: `/pages/messages/chat?userId=${userId}&userName=${encodeURIComponent(userName)}`
      })
    } catch (error) {
      console.error('检查用户设置失败:', error)
      // 出错时默认允许私信
      wx.navigateTo({
        url: `/pages/messages/chat?userId=${userId}&userName=${encodeURIComponent(userName)}`
      })
    }
  },

  async sendFriendRequest(e) {
    const { userId, userName } = e.currentTarget.dataset
    
    if (!isLoggedIn()) {
      await promptLogin({ content: '登录后可以添加好友并管理好友申请。' })
      return
    }

    try {
      const res = await callApi('friends/sendRequest', { targetUserId: userId })
      
      if (res.ok) {
        toast('好友申请已发送')
      } else if (res.error === 'self_request') {
        toast('不能添加自己为好友')
      } else if (res.error === 'request_exists') {
        toast('您的好友申请已发送，请等待对方通过')
      } else if (res.error === 'already_friends') {
        toast('已经是好友')
      } else {
        toast('发送失败，请重试')
      }
    } catch (error) {
      console.error('发送好友申请失败:', error)
      toast('发送失败，请重试')
    }
  }
})
