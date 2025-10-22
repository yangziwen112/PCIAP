import { callApi, toast } from '../../utils/request'
import favoriteManager from '../../utils/favoriteManager'

Page({
  data: {
    list: [],
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false,
    banners: [],
    refreshing: false,
    showCreateBtn: false,  // 改为false，正常用户不显示
    debugInfo: '',
    // 標籤過濾相關
    selectedTag: 'all',
    filteredList: [],
    tags: [
      { id: 'all', name: '全部', icon: '🏠' },
      { id: 'competition', name: '竞赛', icon: '🏆' },
      { id: 'academic', name: '讲座', icon: '🎓' },
      { id: 'recruit', name: '招聘', icon: '💼' },
      { id: 'sports', name: '文体', icon: '⚽' }
    ],
    isDevelopment: false,  // 是否开发模式
    isAdmin: false  // 添加管理员标志
  },

  async onShow() {
    this.checkLoginStatus()
    // 检查是否是管理员
    const { isAdmin, getUser } = require('../../utils/auth')
    const isAdminFlag = isAdmin()
    const userInfo = getUser()
    
    console.log('=== 首页 onShow 调试信息 ===')
    console.log('用户信息:', userInfo)
    console.log('用户角色:', userInfo?.role)
    console.log('isAdmin()结果:', isAdminFlag)
    
    this.setData({ isAdmin: isAdminFlag })
    
    console.log('设置后 isAdmin:', this.data.isAdmin)
    console.log('=== 调试结束 ===')
  },

  onLoad() {
    this.initPage()
  },

  onPullDownRefresh() {
    this.refreshData()
  },

  onReachBottom() {
    if (this.data.loading || !this.data.hasMore) return
    this.loadMore()
  },

  // 初始化页面
  async initPage() {
    const app = getApp()
    this.setData({ 
      banners: app.globalData.meta.banners || [],
      refreshing: true
    })
    await this.loadList(true)
    this.setData({ refreshing: false })
    // 初始化過濾列表
    this.filterContent()
  },

  // 切换开发模式（长按标题）
  toggleDevMode() {
    const isDevelopment = !this.data.isDevelopment
    this.setData({ isDevelopment })
    toast(isDevelopment ? '开发模式已启用' : '开发模式已关闭')
  },

  // 检查登录状态
  checkLoginStatus() {
    const { isLoggedIn } = require('../../utils/auth')
    if (isLoggedIn()) {
      this.updateFavoriteStatus()
    }
    // 不管是否登录都加载列表
    this.loadList(true)
  },

  // 刷新数据
  async refreshData() {
    this.setData({ refreshing: true })
    await this.loadList(true)
    this.setData({ refreshing: false })
    wx.stopPullDownRefresh()
  },

  // 加载列表
  async loadList(reset = false) {
    if (this.data.loading) return
    
    this.setData({ loading: true })
    const page = reset ? 1 : this.data.page + 1
    
    try {
      console.log('开始调用 feed/recommend API')
      const res = await callApi('feed/recommend', { 
        page, 
        pageSize: this.data.pageSize 
      })
      
      console.log('API 调用结果:', res)
      
      const list = reset ? (res.list || []) : this.data.list.concat(res.list || [])
      // 使用收藏管理器更新收藏状态
      const updatedList = favoriteManager.updateContentList(list)
      this.setData({
        list: updatedList,
        page,
        hasMore: !!res.hasMore,
        loading: false,
        showCreateBtn: updatedList.length === 0,
        // debugInfo: `加载了 ${updatedList.length} 条数据`
      })
      // 更新過濾列表
      this.filterContent()
    } catch (error) {
      console.error('加载数据失败:', error)
      this.setData({ 
        loading: false,
        debugInfo: `加载失败: ${error.message || error}`
      })
      toast('加载失败，请重试')
    }
  },

  // 加载更多
  loadMore() {
    this.loadList(false)
  },

  // 手动刷新
  onRefresh() {
    if (this.data.refreshing) return
    this.refreshData()
  },

  // 测试云函数连接
  async testConnection() {
    try {
      wx.showLoading({ title: "测试连接..." })
      
      console.log('开始测试云函数连接')
      const result = await callApi('meta/tags', {})
      
      wx.hideLoading()
      console.log('测试结果:', result)
      
      wx.showModal({
        title: "连接测试",
        content: `云函数连接${result.list ? '成功' : '失败'}\n结果: ${JSON.stringify(result)}`,
        showCancel: false
      })
    } catch (error) {
      wx.hideLoading()
      console.error('连接测试失败:', error)
      wx.showModal({
        title: "连接测试失败",
        content: `错误: ${error.message || error}`,
        showCancel: false
      })
    }
  },

  // 初始化数据库集合
  async initCollections() {
    try {
      wx.showLoading({ title: "初始化集合..." })
      
      console.log('开始初始化数据库集合')
      const result = await callApi('dev/initCollections', {})
      
      wx.hideLoading()
      console.log('初始化结果:', result)
      
      wx.showModal({
        title: "集合初始化",
        content: result.details || result.message,
        showCancel: false
      })
    } catch (error) {
      wx.hideLoading()
      console.error('初始化集合失败:', error)
      wx.showModal({
        title: "初始化失败",
        content: `错误: ${error.message || error}`,
        showCancel: false
      })
    }
  },

  // 测试写入功能
  async testWrite() {
    try {
      wx.showLoading({ title: "测试写入..." })
      
      console.log('开始测试写入功能')
      const result = await callApi('dev/testWrite', {})
      
      wx.hideLoading()
      console.log('写入测试结果:', result)
      
      wx.showModal({
        title: "写入测试",
        content: `写入测试${result.ok ? '成功' : '失败'}\n结果: ${JSON.stringify(result)}`,
        showCancel: false
      })
    } catch (error) {
      wx.hideLoading()
      console.error('写入测试失败:', error)
      wx.showModal({
        title: "写入测试失败",
        content: `错误: ${error.message || error}`,
        showCancel: false
      })
    }
  },

  // 清理重复数据
  async cleanDuplicates() {
    try {
      wx.showLoading({ title: "清理中..." })
      
      console.log('开始清理重复数据')
      const result = await callApi('dev/cleanDuplicates', {})
      
      wx.hideLoading()
      console.log('清理结果:', result)
      
      if (result.ok) {
        const info = `清理完成！
标签: ${result.results.tags.deleted}/${result.results.tags.total} 个重复
来源: ${result.results.sources.deleted}/${result.results.sources.total} 个重复`
        
        wx.showModal({
          title: "清理成功",
          content: info,
          showCancel: false,
          success: () => {
            // 刷新页面
            this.loadList(true)
          }
        })
      } else {
        wx.showModal({
          title: "清理失败",
          content: `错误: ${result.message || result.error || '未知错误'}`,
          showCancel: false
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('清理失败:', error)
      wx.showModal({
        title: "清理失败",
        content: `网络错误: ${error.message || error}`,
        showCancel: false
      })
    }
  },

  // 检查数据库内容
  async checkDatabase() {
    try {
      wx.showLoading({ title: "检查数据库..." })
      
      const [tags, sources, contents, banners] = await Promise.all([
        callApi('meta/tags', {}),
        callApi('meta/sources', {}),
        callApi('content/list', { page: 1, pageSize: 10 }),
        callApi('meta/banners', {})
      ])
      
      wx.hideLoading()
      
      const info = `数据库内容：
标签: ${tags.list?.length || 0} 个
来源: ${sources.list?.length || 0} 个
内容: ${contents.list?.length || 0} 条
横幅: ${banners.list?.length || 0} 个`
      
      console.log('数据库检查结果:', { tags, sources, contents, banners })
      
      wx.showModal({
        title: "数据库检查",
        content: info,
        showCancel: false
      })
    } catch (error) {
      wx.hideLoading()
      console.error('检查数据库失败:', error)
      wx.showModal({
        title: "检查失败",
        content: `错误: ${error.message || error}`,
        showCancel: false
      })
    }
  },

  // 创建示例数据
  async onCreateData() {
    try {
      wx.showLoading({ title: "正在创建数据..." })
      
      console.log('开始创建示例数据')
      const result = await callApi('dev/createSampleData', {})
      
      wx.hideLoading()
      console.log('创建结果:', result)
      
      if (result.ok) {
        wx.showModal({
          title: "创建成功",
          content: `成功创建了：
          • ${result.inserted.users} 个用户账号
          • ${result.inserted.tags} 个标签
          • ${result.inserted.sources} 个来源
          • ${result.inserted.contents} 条内容
          • ${result.inserted.banners} 个横幅
          
默认账号：
账号：23012774
密码：23012774
身份：学生
身份证后四位：6613`,
          showCancel: false,
          success: () => {
            // 延迟一下再刷新，确保数据写入完成
            setTimeout(() => {
              this.loadList(true)
              this.setData({ showCreateBtn: false })
            }, 1000)
          }
        })
      } else {
        wx.showModal({
          title: "创建失败",
          content: `错误: ${result.message || result.error || '未知错误'}`,
          showCancel: false
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('创建数据失败:', error)
      wx.showModal({
        title: "创建失败",
        content: `网络错误: ${error.message || error}`,
        showCancel: false
      })
    }
  },

  // 標籤點擊過濾
  onTagClick(e) {
    const tagId = e.currentTarget.dataset.tag
    this.setData({ selectedTag: tagId })
    this.filterContent()
  },

  // 過濾內容
  filterContent() {
    const { list, selectedTag } = this.data
    let filteredList = []
    
    if (selectedTag === 'all') {
      filteredList = list
    } else {
      // 根據標籤過濾內容
      filteredList = list.filter(item => {
        // 檢查內容的標籤或類別
        const tags = item.tags || []
        const category = item.category || ''
        
        // 匹配標籤或類別
        return tags.includes(selectedTag) || 
               category === selectedTag ||
               (selectedTag === 'competition' && (category === 'competition' || tags.some(tag => tag.includes('竞赛') || tag.includes('比赛')))) ||
               (selectedTag === 'academic' && (category === 'academic' || tags.some(tag => tag.includes('讲座') || tag.includes('学术')))) ||
               (selectedTag === 'recruit' && (category === 'recruit' || tags.some(tag => tag.includes('招聘') || tag.includes('实习')))) ||
               (selectedTag === 'sports' && (category === 'sports' || tags.some(tag => tag.includes('文体') || tag.includes('体育'))))
      })
    }
    
    this.setData({ filteredList })
  },

  // 收藏操作
  async onFavorite(e) {
    const { isLoggedIn } = require('../../utils/auth')
    if (!isLoggedIn()) { 
      wx.showToast({ title: '请先登录', icon: 'none' })
      return 
    }
    
    const id = e.detail.id
    try {
      await callApi('user/favorite/toggle', { contentId: id })
      const list = this.data.list.map(it => 
        it._id === id ? { ...it, favored: !it.favored } : it
      )
      this.setData({ list })
      
      const item = this.data.list.find(it => it._id === id)
      const isFavorited = !item?.favored
      
      // 更新本地收藏状态缓存
      favoriteManager.setFavoriteStatus(id, isFavorited)
      
      toast(isFavorited ? '已收藏' : '已取消收藏')
    } catch (error) {
      console.error('收藏操作失败:', error)
      toast('操作失败，请重试')
    }
  },

  // 更新收藏状态
  updateFavoriteStatus() {
    if (this.data.list.length > 0) {
      const updatedList = favoriteManager.updateContentList(this.data.list)
      this.setData({ list: updatedList })
      // 更新過濾列表
      this.filterContent()
    }
  },

  // 搜索功能
  onSearch(e) {
    const q = e.detail.value?.trim()
    if (!q) {
      toast('请输入搜索关键词')
      return
    }
    
    this.saveSearchHistory(q)
    // 搜索功能已移除，可以在此處添加其他搜索邏輯
    toast('搜索功能暫未開放')
  },

  // 保存搜索历史
  saveSearchHistory(keyword) {
    try {
      let history = wx.getStorageSync('search_history') || []
      history = history.filter(item => item !== keyword)
      history.unshift(keyword)
      history = history.slice(0, 10)
      wx.setStorageSync('search_history', history)
    } catch (error) {
      console.error('保存搜索历史失败:', error)
    }
  },

  // 跳转到订阅页面
  goToSubscription() {
    wx.switchTab({ url: '/pages/subscription/index' })
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: 'PCIAP - 校园活动聚合平台',
      path: '/pages/home/index'
    }
  },

  // 跳转到发布页面
  goToPublish() {
    console.log('🔴 发布按钮被点击了！')
    console.log('即将跳转到发布页面...')
    wx.navigateTo({ url: '/pages/publish/index' })
  }
})