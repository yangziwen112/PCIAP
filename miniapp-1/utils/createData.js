// 创建示例数据工具
const app = getApp()

async function createSampleData() {
  try {
    wx.showLoading({ title: "正在创建数据..." })
    
    const result = await app.callApi("dev/createSampleData", {})
    
    wx.hideLoading()
    
    if (result.ok) {
      wx.showModal({
        title: "创建成功",
        content: `成功创建了：
         ${result.inserted.tags} 个标签
         ${result.inserted.sources} 个来源
         ${result.inserted.contents} 条内容
         ${result.inserted.banners} 个横幅`,
        showCancel: false,
        success: () => {
          // 刷新当前页面
          const pages = getCurrentPages()
          const currentPage = pages[pages.length - 1]
          if (currentPage && currentPage.loadList) {
            currentPage.loadList(true)
          }
        }
      })
    } else {
      wx.showModal({
        title: "创建失败",
        content: result.message || "未知错误",
        showCancel: false
      })
    }
  } catch (error) {
    wx.hideLoading()
    console.error("创建数据失败:", error)
    wx.showModal({
      title: "创建失败",
      content: "网络错误，请重试",
      showCancel: false
    })
  }
}

module.exports = {
  createSampleData
}
