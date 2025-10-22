import { callApi, toast } from '../../utils/request'
import favoriteManager from '../../utils/favoriteManager'
import { isLoggedIn, getUserId } from '../../utils/auth'

Page({
  data: {
    id: '',
    detail: {},
    viewStartTime: 0
  },
  
  async onLoad(query) {
    console.log('📌 详情页 onLoad，query:', query)
    const contentId = query.id || ''
    this.setData({ 
      id: contentId,
      viewStartTime: Date.now()
    })
    console.log('✅ 记录进入时间:', this.data.viewStartTime, '内容ID:', contentId)
    this.loadDetail()
  },
  
  async onShow() {
    console.log('📌 详情页 onShow')
    // 重新检查收藏状态
    this.loadDetail()
  },
  
  // 记录浏览历史 - onHide
  async onHide() {
    console.log('📌 详情页 onHide 触发')
    await this.recordViewHistory()
  },
  
  // 记录浏览历史 - onUnload
  async onUnload() {
    console.log('📌 详情页 onUnload 触发')
    await this.recordViewHistory()
  },
  
  // 实际记录逻辑
  async recordViewHistory() {
    console.log('🔍 开始记录浏览历史...')
    const logged = isLoggedIn()
    const contentId = this.data.id
    const userId = getUserId()
    
    console.log('检查条件:')
    console.log('  - isLoggedIn:', logged)
    console.log('  - contentId:', contentId)
    console.log('  - userId:', userId)
    
    if (!logged || !contentId) {
      console.log('❌ 不记录：未登录或无内容ID')
      return
    }
    
    const duration = Date.now() - this.data.viewStartTime
    
    console.log('📤 即将发送 history/record:')
    console.log('  - contentId:', contentId)
    console.log('  - duration:', duration)
    console.log('  - userId:', userId)
    
    try {
      const res = await callApi('history/record', { 
        contentId: contentId,
        duration: Math.max(0, duration)
      })
      console.log('✅ 浏览历史已记录，响应:', res)
    } catch (error) {
      console.error('❌ 记录历史失败:', error)
    }
  },
  
  async loadDetail() {
    if (!this.data.id) return
    try {
      const res = await callApi('content/detail', { id: this.data.id })
      const detail = res.detail || {}
      
      // 检查收藏状态
      if (isLoggedIn()) {
        const favRes = await callApi('favorites/list', { pageSize: 100 })
        const favorites = favRes.list || []
        detail.favored = favorites.some(f => f._id === this.data.id)
      } else {
        detail.favored = favoriteManager.getFavoriteStatus(this.data.id)
      }
      
      this.setData({ detail })
    } catch (error) {
      console.error('加载详情失败:', error)
      toast('加载失败')
    }
  },
  
  onToggleFavorite() {
    const { isLoggedIn } = require('../../utils/auth')
    if (!isLoggedIn()) { 
      wx.showToast({ title: '请先登录', icon: 'none' })
      return 
    }
    
    const id = this.data.id
    callApi('user/favorite/toggle', { contentId: id }).then(() => {
      const newFavoredStatus = !this.data.detail.favored
      this.setData({ detail: { ...this.data.detail, favored: newFavoredStatus } })
      
      favoriteManager.setFavoriteStatus(id, newFavoredStatus)
      
      toast(newFavoredStatus ? '已收藏' : '已取消收藏')
    }).catch(() => toast('操作失败'))
  },
  
  onOpenSource() {
    const url = this.data.detail.sourceUrl
    if (!url) return
    if (url.startsWith('http')) {
      wx.setClipboardData({ 
        data: url, 
        success: () => wx.showToast({ title: '链接已复制，请在浏览器打开', icon: 'none' }) 
      })
    }
  },
  
  onShareAppMessage() {
    return {
      title: this.data.detail.title || '活动详情',
      path: `/pages/detail/index?id=${this.data.id}`
    }
  }
})