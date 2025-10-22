// pages/debug/index.js
Page({
  data: {
    logs: [],
    testResults: {}
  },

  onLoad() {
    this.addLog('調試頁面加載完成')
    this.testCloudFunction()
  },

  addLog(message) {
    const logs = this.data.logs
    logs.push({
      time: new Date().toLocaleTimeString(),
      message: message
    })
    this.setData({ logs })
  },

  async testCloudFunction() {
    this.addLog('開始測試雲函數連接...')
    
    try {
      // 測試雲函數調用
      const result = await wx.cloud.callFunction({
        name: 'api',
        data: { 
          route: 'meta/tags',
          data: {}
        }
      })
      
      this.addLog('雲函數調用成功')
      this.addLog('返回結果: ' + JSON.stringify(result))
      
      this.setData({
        testResults: {
          cloudFunction: 'success',
          result: result
        }
      })
      
    } catch (error) {
      this.addLog('雲函數調用失敗: ' + error.message)
      this.setData({
        testResults: {
          cloudFunction: 'failed',
          error: error.message
        }
      })
    }
  },

  async testDatabase() {
    this.addLog('開始測試數據庫連接...')
    
    try {
      const result = await wx.cloud.callFunction({
        name: 'api',
        data: { 
          route: 'dev/testWrite',
          data: {}
        }
      })
      
      this.addLog('數據庫測試成功')
      this.addLog('返回結果: ' + JSON.stringify(result))
      
    } catch (error) {
      this.addLog('數據庫測試失敗: ' + error.message)
    }
  },

  async initDatabase() {
    this.addLog('開始初始化數據庫...')
    
    try {
      const result = await wx.cloud.callFunction({
        name: 'api',
        data: { 
          route: 'dev/initCollections',
          data: {}
        }
      })
      
      this.addLog('數據庫初始化成功')
      this.addLog('返回結果: ' + JSON.stringify(result))
      
    } catch (error) {
      this.addLog('數據庫初始化失敗: ' + error.message)
    }
  },

  clearLogs() {
    this.setData({ logs: [] })
  }
})
