// app.js
App({
  globalData: {
    envId: 'cloud1-9gkwb6acd2930e57',
    meta: {
      tags: [],
      sources: [],
      banners: []
    },
    user: null
  },
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用基础库 2.2.3 或以上以使用云能力')
    } else {
      // 确保在调用云函数之前初始化云开发
      try {
        wx.cloud.init({
          env: this.globalData.envId || wx.cloud.DYNAMIC_CURRENT_ENV,
          traceUser: true
        })
        console.log('云开发初始化成功')
        
        // 尝试创建云开发环境
        wx.cloud.database()
        console.log('数据库初始化成功')
      } catch (error) {
        console.error('云开发初始化失败:', error)
        wx.showModal({
          title: '提示',
          content: '请先开通云开发，具体步骤请查看【云开发配置步骤.md】',
          showCancel: false
        })
      }
    }
    this.prefetchMeta()
  },
  async prefetchMeta() {
    try {
      const [tags, sources, banners] = await Promise.all([
        this.callApi('meta/tags', {}),
        this.callApi('meta/sources', {}),
        this.callApi('meta/banners', {})
      ])
      this.globalData.meta = { tags: tags.list || [], sources: sources.list || [], banners: banners.list || [] }
    } catch (e) {
      console.warn('预取元数据失败', e)
    }
  },
  callApi(route, data) {
    return wx.cloud.callFunction({
      name: 'api',
      data: { route, data }
    }).then(res => res.result || {}).catch((err) => {
      console.warn('云函数调用失败', route, err)
      return {}
    })
  },
  // 获取用户信息
  getUser() {
    return this.globalData.user
  },
  // 设置用户信息
  setUser(user) {
    this.globalData.user = user
  },
  // 清除用户信息
  clearUser() {
    this.globalData.user = null
  }
})
