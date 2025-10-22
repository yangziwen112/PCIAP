# 雲函數部署問題解決指南

## 問題描述
雲函數文件夾 `cloudfunctions/api` 沒有顯示"上傳部署"按鈕，提示"未被定義為當前環境"。

## 已修復的配置

### 1. 根目錄 project.config.json
已添加雲函數配置：
```json
{
  "cloudfunctionRoot": "miniapp-1/cloudfunctions/",
  "cloudfunctionTemplateRoot": "miniapp-1/cloudfunctions/"
}
```

### 2. 雲函數配置文件
已創建 `miniapp-1/cloudfunctions/api/config.json`：
```json
{
  "permissions": {
    "openapi": []
  }
}
```

### 3. 雲函數依賴
已更新 `package.json` 並重新安裝依賴。

## 解決步驟

### 步驟 1: 重啟微信開發者工具
1. 完全關閉微信開發者工具
2. 重新打開項目
3. 等待項目重新加載

### 步驟 2: 檢查雲開發環境
1. 在微信開發者工具中，點擊 "雲開發" 按鈕
2. 確保已開通雲開發服務
3. 記錄您的環境ID（格式：cloud1-xxxxxxxx）

### 步驟 3: 更新環境ID
如果環境ID與設置的不同，請更新 `miniapp-1/app.js`：
```javascript
globalData: {
  envId: '您的實際環境ID', // 替換為實際的環境ID
  // ...
}
```

### 步驟 4: 檢查雲函數識別
1. 在微信開發者工具中，查看左側文件樹
2. `cloudfunctions/api` 文件夾應該顯示為雲函數圖標
3. 右鍵點擊應該有"上傳並部署：雲函數"選項

### 步驟 5: 部署雲函數
1. 右鍵點擊 `cloudfunctions/api` 文件夾
2. 選擇 "上傳並部署：雲函數"
3. 等待部署完成

## 如果仍然沒有部署按鈕

### 方法 1: 手動創建雲函數
1. 在微信開發者工具中，右鍵點擊 `cloudfunctions` 文件夾
2. 選擇 "新建雲函數"
3. 輸入名稱：`api`
4. 將現有的 `index.js` 內容複製到新創建的雲函數中

### 方法 2: 檢查項目結構
確保項目結構正確：
```
miniapp-1/
├── cloudfunctions/
│   └── api/
│       ├── index.js
│       ├── package.json
│       ├── config.json
│       └── node_modules/
├── pages/
├── app.js
└── app.json
```

### 方法 3: 重新初始化雲開發
1. 在微信開發者工具中，點擊 "雲開發"
2. 如果沒有環境，創建新環境
3. 確保環境狀態為"正常"

## 測試部署

部署完成後，使用調試頁面測試：
1. 編譯並預覽小程序
2. 導航到 `pages/debug/index`
3. 點擊 "測試雲函數" 按鈕
4. 查看調試日誌

## 常見問題

### Q: 仍然沒有部署按鈕
A: 嘗試完全重啟微信開發者工具，或手動創建新的雲函數

### Q: 部署失敗
A: 檢查網絡連接，確保微信開發者工具已登錄

### Q: 雲函數調用失敗
A: 檢查環境ID是否正確，確保雲函數已成功部署

## 聯繫支持
如果問題仍然存在，請提供：
1. 微信開發者工具版本
2. 項目結構截圖
3. 錯誤信息截圖
