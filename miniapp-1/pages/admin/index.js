import { callApi, toast } from "../../utils/request"

Page({
  data: {
    status: "",
    dataInfo: null
  },

  onLoad() {
    this.loadDataInfo()
  },

  // 创建示例数据
  async createSampleData() {
    try {
      wx.showLoading({ title: "正在创建数据..." })
      
      const result = await callApi("dev/createSampleData", {})
      
      wx.hideLoading()
      
      if (result.ok) {
        this.setData({
          status: `创建成功！插入了${result.inserted.contents}条内容`,
          dataInfo: result.inserted
        })
        toast("示例数据创建成功")
      } else {
        this.setData({ status: `创建失败: ${result.message}` })
        toast("创建失败")
      }
    } catch (error) {
      wx.hideLoading()
      console.error("创建数据失败:", error)
      this.setData({ status: "创建失败，请重试" })
      toast("创建失败")
    }
  },

  // 查看数据统计
  async viewData() {
    try {
      wx.showLoading({ title: "正在查询..." })
      
      const [tags, sources, banners, contents] = await Promise.all([
        callApi("meta/tags", {}),
        callApi("meta/sources", {}),
        callApi("meta/banners", {}),
        callApi("content/list", { page: 1, pageSize: 1 })
      ])
      
      wx.hideLoading()
      
      this.setData({
        dataInfo: {
          tags: tags.list?.length || 0,
          sources: sources.list?.length || 0,
          banners: banners.list?.length || 0,
          contents: contents.list?.length || 0
        },
        status: "数据统计已更新"
      })
    } catch (error) {
      wx.hideLoading()
      console.error("查询数据失败:", error)
      toast("查询失败")
    }
  },

  // 清空数据
  async clearData() {
    wx.showModal({
      title: "确认清空",
      content: "确定要清空所有数据吗？此操作不可恢复！",
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: "正在清空..." })
            // 这里可以添加清空数据的逻辑
            wx.hideLoading()
            this.setData({ 
              status: "数据已清空",
              dataInfo: null
            })
            toast("数据已清空")
          } catch (error) {
            wx.hideLoading()
            console.error("清空数据失败:", error)
            toast("清空失败")
          }
        }
      }
    })
  },

  // 加载数据信息
  async loadDataInfo() {
    try {
      const [tags, sources, banners, contents] = await Promise.all([
        callApi("meta/tags", {}),
        callApi("meta/sources", {}),
        callApi("meta/banners", {}),
        callApi("content/list", { page: 1, pageSize: 1 })
      ])
      
      this.setData({
        dataInfo: {
          tags: tags.list?.length || 0,
          sources: sources.list?.length || 0,
          banners: banners.list?.length || 0,
          contents: contents.list?.length || 0
        }
      })
    } catch (error) {
      console.error("加载数据信息失败:", error)
    }
  }
})
