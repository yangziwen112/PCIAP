# 爬蟲對接與資料入庫指南

本專案前端（小程式）已預留以下 API 與欄位，用於顯示爬取內容，並在「發現」頁提供搜尋與篩選。請後端與爬蟲按本文對接。

## 一、資料模型（建議）
- collection: `contents`
  - `_id`: string
  - `title`: string
  - `summary`: string
  - `coverUrl`: string
  - `sourceId`: string  // 對應來源表
  - `sourceName`: string
  - `campus`: 'all' | 'haidian' | 'fengtai'
  - `category`: 'competition' | 'teacher-cert' | 'academic' | 'recruit' | 'sports' | 'notice'
  - `tags`: string[]
  - `publishTime`: number // 文章發布時間的毫秒 timestamp（必填，用於排序）
  - `createdAt`: number   // 入庫時間
  - `favored`: boolean    // 可選，接口按用戶返回

- collection: `sources`
  - `_id`: string
  - `name`: string

- collection: `tags`
  - `_id`: string
  - `name`: string

## 二、分類映射（與前端一致）
- 競賽類 → `competition`
- 教資類 → `teacher-cert`
- 講座學術 → `academic`
- 招聘實習 → `recruit`
- 文體活動 → `sports`
- 通知公告 → `notice`

## 三、列表接口（供發現頁）
GET `content/list`
請求參數：
- `page`: number
- `pageSize`: number
- `campus`: 'all' | 'haidian' | 'fengtai'
- `type`(可選): 對應 `category`
- `timeRange`: 'month' | 'week' | 'today'
- `sort`: 'latest' | 'hottest'
- `q`(可選): 關鍵詞

返回：
```
{
  list: Array<{
    _id: string,
    title: string,
    summary: string,
    coverUrl?: string,
    favored?: boolean,
    publishTime: number,
    sourceName?: string,
    category: string
  }>,
  hasMore: boolean
}
```

後端實作要點：
- `sort=latest` 時按 `publishTime` 倒序排列（最新在前）。
- `timeRange` 可用 `publishTime` 與當前時間做區間過濾。
- 關鍵詞 `q` 對 `title`/`summary` 做全文或前綴匹配。

## 四、推薦與訂閱相關接口
- GET `feed/recommend`：首頁推薦，結構同上。
- GET `meta/sources`：返回 `sources.list`。
- GET `meta/tags`：返回 `tags.list`。
- POST `user/subscribe/get`：返回 `{ sourceIds: string[], tagIds: string[] }`。
- POST `user/subscribe/set`：提交 `{ sourceIds: string[] }`。

## 五、爬蟲入庫示例流程
1. 爬取到文章元資料（標題、連結、來源、時間、分類、校區等）。
2. 轉換分類到上述 `category` 值，解析發布時間為毫秒 `publishTime`。
3. 去重（以來源 URL 或來源方的文章 ID 作唯一索引）。
4. 寫入 `contents` 集合；若已存在則更新 `summary/coverUrl/publishTime/tags`。
5. 來源不存在時，新增到 `sources` 集合。

## 六、測試資料（可選）
可臨時提供 `content/list` 的靜態 JSON 以驗證前端流程，確保 `publishTime` 為最近時間以觀察排序。 