import { callApi, toast } from '../../utils/request'
import { isLoggedIn, getUserId } from '../../utils/auth'

Page({
  data: {
    list: [],
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false,
    totalCount: 0,
    editMode: false
  },
  
  async onShow() {
    console.log('📌 历史页 onShow 触发')
    if (!isLoggedIn()) {
      console.log('❌ 未登录，重定向到登录页')
      wx.showToast({ title: '请先登录', icon: 'none' })
      setTimeout(() => {
        wx.switchTab({ url: '/pages/profile/index' })
      }, 1000)
      return
    }
    console.log('✅ 已登录，用户ID:', getUserId())
    this.loadList(true)
  },
  
  onPullDownRefresh() {
    this.loadList(true).finally(() => wx.stopPullDownRefresh())
  },
  
  onReachBottom() {
    if (this.data.loading || !this.data.hasMore) return
    this.loadList(false)
  },
  
  async loadList(reset = false) {
    console.log('🔄 开始加载历史列表，reset:', reset)
    this.setData({ loading: true })
    const page = reset ? 1 : this.data.page + 1
    
    try {
      console.log('📤 调用 history/list API:')
      console.log('  - page:', page)
      console.log('  - pageSize:', this.data.pageSize)
      
      const res = await callApi('history/list', { 
        page, 
        pageSize: this.data.pageSize 
      })
      
      console.log('📥 API 响应:', res)
      console.log('  - 返回项数:', (res.list || []).length)
      console.log('  - totalCount:', res.totalCount)
      console.log('  - hasMore:', res.hasMore)
      
      const list = reset ? (res.list || []) : this.data.list.concat(res.list || [])
      const totalCount = res.totalCount || list.length
      
      console.log('✅ 列表更新:')
      console.log('  - 总项数:', list.length)
      console.log('  - totalCount:', totalCount)
      
      this.setData({ 
        list, 
        page, 
        hasMore: res.hasMore || false,
        totalCount,
        loading: false 
      })
      
    } catch (error) {
      console.error('❌ 加载历史失败:', error)
      this.setData({ loading: false })
      toast('加载失败')
    }
  },
  
  // 删除单条历史
  async onRemoveHistory(e) {
    const id = e.currentTarget.dataset.id
    console.log('🗑️ 删除历史:', id)
    
    wx.showModal({
      title: '删除历史',
      content: '确认删除这条浏览记录吗？',
      success: async (res) => {
        if (!res.confirm) return
        
        try {
          await callApi('history/remove', { contentId: id })
          
          this.setData({ 
            list: this.data.list.filter(it => it._id !== id),
            totalCount: Math.max(0, this.data.totalCount - 1)
          })
          
          toast('已删除')
        } catch (error) {
          toast('删除失败')
        }
      }
    })
  },
  
  // 清空所有历史
  async onClearAll() {
    console.log('🗑️ 清空所有历史')
    if (this.data.totalCount === 0) {
      toast('暂无历史')
      return
    }
    
    wx.showModal({
      title: '清空历史',
      content: `确认删除全部 ${this.data.totalCount} 条历史记录吗？此操作不可恢复`,
      confirmColor: '#ff6b6b',
      success: async (res) => {
        if (!res.confirm) return
        
        wx.showLoading({ title: '清空中...' })
        try {
          await callApi('history/clearAll', {})
          
          this.setData({ 
            list: [],
            totalCount: 0,
            editMode: false
          })
          
          wx.hideLoading()
          toast('已清空全部历史')
        } catch (error) {
          wx.hideLoading()
          toast('清空失败')
        }
      }
    })
  },
  
  // 切换编辑模式
  onToggleEditMode() {
    this.setData({ editMode: !this.data.editMode })
  }
}) 