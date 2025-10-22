// 初始化示例数据脚本
// 在微信开发者工具中运行此脚本

const app = getApp()

async function initSampleData() {
  try {
    wx.showLoading({ title: "正在初始化数据..." })
    
    const result = await app.callApi("dev/initSeed", {})
    
    wx.hideLoading()
    
    if (result.ok) {
      wx.showToast({
        title: `初始化成功！插入了${result.inserted.contents}条内容`,
        icon: "success"
      })
      
      // 刷新当前页面
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1]
      if (currentPage && currentPage.loadList) {
        currentPage.loadList(true)
      }
    } else {
      wx.showToast({
        title: "初始化失败",
        icon: "error"
      })
    }
  } catch (error) {
    wx.hideLoading()
    console.error("初始化数据失败:", error)
    wx.showToast({
      title: "初始化失败",
      icon: "error"
    })
  }
}

// 导出函数供页面调用
module.exports = {
  initSampleData
}
