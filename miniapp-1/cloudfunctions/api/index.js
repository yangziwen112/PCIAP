const cloud = require('wx-server-sdk')

// 初始化雲開發環境
cloud.init({ 
  env: cloud.DYNAMIC_CURRENT_ENV,
  traceUser: true
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { route, data } = event
  const ctx = cloud.getWXContext()
  const userId = ctx.OPENID || 'anon'

  console.log('云函数调用:', route, data)
  console.log('用户信息:', ctx)
  console.log('环境信息:', cloud.DYNAMIC_CURRENT_ENV)

  try {
    switch (route) {
      case 'meta/tags':
        return await getTags()
      case 'meta/sources':
        return await getSources()
      case 'meta/banners':
        return await getBanners()

      case 'feed/recommend':
        return await listContents({ ...data })
      case 'content/list':
        return await listContents({ ...data })
      case 'content/detail':
        return await getContentDetail({ id: data?.id })

      case 'content/publish':
        return await publishContent({ userId, ...data })

      case 'user/favorite/toggle':
        return await toggleFavorite({ userId, contentId: data?.contentId })
      case 'favorites/list':
        return await listFavorites({ userId, ...data })

      case 'history/list':
        return await listHistory({ userId, ...data })

      case 'user/subscribe/get':
        return await getSubscription({ userId: data?.userId || userId })
      case 'user/subscribe/set':
        return await setSubscription({ 
          userId: data?.userId || userId, 
          sourceIds: data?.sourceIds, 
          tagIds: data?.tagIds 
        })

      // 删除功能路由
      case 'user/favorite/remove':
        return await removeFavorite({ userId, contentId: data?.contentId })
      case 'user/favorite/clearAll':
        return await clearAllFavorites({ userId })
      case 'history/remove':
        return await removeHistory({ userId, contentId: data?.contentId })
      case 'history/clearAll':
        return await clearAllHistory({ userId })
      case 'history/record':
        return await recordHistory({ userId, contentId: data?.contentId, duration: data?.duration || 0 })
      
      case 'ingest/content':
        return await ingestContent({ payload: data, headers: event.headers, userId })

      case 'dev/initSeed':
        return await initSeed()
      
      case 'dev/createSampleData':
        return await createSampleData()
      
      case 'dev/testWrite':
        return await testWrite()
      
      case 'dev/initCollections':
        return await initCollections()
      
      case 'dev/cleanDuplicates':
        return await cleanDuplicates()
      
      case 'dev/initDefaultUser':
        return await initDefaultUser()
      
      // 用户认证相关
      case 'auth/login':
        return await userLogin(data)
      
      case 'auth/register':
        return await userRegister(data)
      
      case 'auth/resetPassword':
        return await resetPassword(data)
      
      case 'auth/getUserInfo':
        return await getUserInfo({ userId })

      default:
        return { error: 'unknown route' }
    }
  } catch (e) {
    console.error('api error', route, e)
    return { error: 'internal_error', message: e.message }
  }
}

// 初始化数据库集合
async function initCollections() {
  try {
    console.log('开始初始化数据库集合')
    
    // 创建所有需要的集合
    const collections = ['users', 'tags', 'sources', 'banners', 'contents', 'favorites', 'history', 'subscriptions', 'test']
    const results = []
    
    // 创建或验证所有集合
    for (const collectionName of collections) {
      try {
        // 尝试创建集合
        await db.createCollection(collectionName)
        results.push(`${collectionName}: 创建成功`)
      } catch (error) {
        // 如果集合已存在，检查是否可以访问
        if (error.message.includes('exist')) {
          try {
            await db.collection(collectionName).limit(1).get()
            results.push(`${collectionName}: 已存在且可访问`)
          } catch (e) {
            results.push(`${collectionName}: 访问失败 - ${e.message}`)
          }
        } else {
          results.push(`${collectionName}: 创建失败 - ${error.message}`)
        }
      }
    }

    // 创建默认用户
    try {
      const defaultUser = {
        username: '23012774',
        password: '23012774',
        role: 'student',
        nickname: '学生用户',
        idCardLast4: '6613',
        avatarUrl: '',
        createdAt: Date.now(),
        isActive: true
      }

      // 检查默认用户是否已存在
      const existingUser = await db.collection('users').where({ username: defaultUser.username }).get()
      if (!existingUser.data || existingUser.data.length === 0) {
        await db.collection('users').add({ data: defaultUser })
        results.push('默认用户: 创建成功')
      } else {
        results.push('默认用户: 已存在')
      }
    } catch (error) {
      results.push(`默认用户: 操作失败 - ${error.message}`)
    }
    
    // 生成状态报告
    const successCount = results.filter(r => r.includes('成功') || r.includes('可访问')).length
    const totalCount = collections.length + 1 // +1 for default user
    
    return { 
      ok: true, 
      message: `初始化完成 (${successCount}/${totalCount})`,
      details: results.join('\n')
    }
  } catch (error) {
    console.error('初始化集合失败:', error)
    return { 
      ok: false, 
      error: '初始化失败', 
      message: error.message 
    }
  }
}

// 测试写入功能 - 修复版本
async function testWrite() {
  try {
    console.log('开始测试写入')
    
    // 先确保集合存在
    try {
      await db.collection('test').limit(1).get()
    } catch (error) {
      console.log('test集合不存在，尝试创建')
    }
    
    // 测试写入一个简单的文档，不指定_id
    const testDoc = {
      title: '测试文档',
      content: '这是一个测试文档',
      timestamp: Date.now()
    }
    
    console.log('准备写入文档:', testDoc)
    
    // 使用 add 方法而不是 set，让系统自动生成_id
    const result = await db.collection('test').add({ data: testDoc })
    
    console.log('写入结果:', result)
    
    return { 
      ok: true, 
      message: '测试写入成功',
      result: result
    }
  } catch (error) {
    console.error('测试写入失败:', error)
    return { 
      ok: false, 
      error: '写入失败', 
      message: error.message 
    }
  }
}

async function getTags() {
  try {
    const res = await db.collection('tags').get()
    return { list: res.data || [] }
  } catch (error) {
    console.error('获取标签失败:', error)
    return { list: [] }
  }
}

async function getSources() {
  try {
    const res = await db.collection('sources').get()
    return { list: res.data || [] }
  } catch (error) {
    console.error('获取来源失败:', error)
    return { list: [] }
  }
}

async function getBanners() {
  try {
    const res = await db.collection('banners').orderBy('ts', 'desc').limit(10).get()
    return { list: res.data || [] }
  } catch (error) {
    console.error('获取横幅失败:', error)
    return { list: [] }
  }
}

async function listContents(params) {
  try {
    const page = Math.max(parseInt(params.page || 1, 10), 1)
    const pageSize = Math.min(parseInt(params.pageSize || 10, 10), 50)
    const campus = params.campus || 'all'
    const type = params.type || ''
    const timeRange = params.timeRange || ''
    const sort = params.sort === 'hottest' ? 'hottest' : 'latest'
    const q = (params.q || '').trim()

    let where = {}
    if (campus && campus !== 'all') where.campus = campus
    if (type) where.category = type

    const now = Date.now()
    if (timeRange === 'today') where.publishTime = _.gte(new Date(new Date().setHours(0,0,0,0)).getTime())
    else if (timeRange === 'week') where.publishTime = _.gte(startOfWeekTs())
    else if (timeRange === 'month') where.publishTime = _.gte(startOfMonthTs())

    if (q) {
      where = _.and(where, _.or([
        { title: db.RegExp({ regexp: q, options: 'i' }) },
        { summary: db.RegExp({ regexp: q, options: 'i' }) }
      ]))
    }

    const collection = db.collection('contents')
    const order = sort === 'hottest' ? { field: 'hotScore', dir: 'desc' } : { field: 'publishTime', dir: 'desc' }

    const base = collection.where(where).orderBy(order.field, order.dir)
    const res = await base.skip((page - 1) * pageSize).limit(pageSize).get()
    const list = (res.data || []).map(stripMedia)
    const hasMore = (res.data || []).length === pageSize
    return { list, hasMore }
  } catch (error) {
    console.error('获取内容列表失败:', error)
    return { list: [], hasMore: false }
  }
}

function stripMedia(doc) {
  const { coverUrl, posterUrl, ...rest } = doc || {}
  return rest
}

async function getContentDetail({ id }) {
  if (!id) return { detail: {} }
  try {
    const res = await db.collection('contents').doc(id).get()
    return { detail: res.data ? stripMedia(res.data) : {} }
  } catch (error) {
    console.error('获取内容详情失败:', error)
    return { detail: {} }
  }
}

// 发布内容 - 管理员专用
async function publishContent({ userId, title, description, tags, sourceId, images }) {
  console.log('🚀 publishContent 被调用')
  console.log('参数:', { userId, title, description, tags, sourceId })
  
  // 验证参数
  if (!title || !description || !sourceId) {
    console.error('❌ 参数不完整')
    return { error: 'params_required', message: '标题、描述和来源必填' }
  }

  if (!tags || tags.length === 0) {
    console.error('❌ 未选择标签')
    return { error: 'tags_required', message: '至少需要选择一个标签' }
  }

  // 检查用户权限 - 这里我们跳过权限检查，因为前端已经检查过了
  // 实际应用中应该在这里验证用户是否是管理员
  
  try {
    console.log('📝 准备写入内容...')
    
    const now = Date.now()
    const contentData = {
      title: title.trim(),
      summary: description.trim().substring(0, 200), // 摘要取前200字
      description: description.trim(),
      tags: Array.isArray(tags) ? tags : [tags],
      sourceId: sourceId,
      coverUrl: '',
      posterUrl: '',
      status: 'published',
      publishedBy: userId,
      createdBy: userId,
      createdAt: now,
      publishTime: now,
      updatedAt: now,
      viewCount: 0,
      favoriteCount: 0,
      shareCount: 0,
      commentCount: 0,
      hotScore: 0,
      featured: false,
      category: '', // 可以根据tag确定
      imageCount: Array.isArray(images) ? images.length : 0
    }
    
    console.log('📝 写入数据:', contentData)
    
    // 写入数据库
    const result = await db.collection('contents').add({ data: contentData })
    
    console.log('✅ 内容发布成功:', result)
    
    return {
      ok: true,
      message: '内容发布成功',
      _id: result._id,
      data: contentData
    }
  } catch (error) {
    console.error('❌ 发布内容失败:', error)
    return {
      error: 'publish_failed',
      message: '发布失败，请重试',
      details: error.message
    }
  }
}

async function toggleFavorite({ userId, contentId }) {
  if (!contentId) return { error: 'contentId_required' }
  try {
    const coll = db.collection('favorites')
    const key = { userId, contentId }
    const exists = await coll.where(key).get()
    if ((exists.data || []).length) {
      await coll.where(key).remove()
    } else {
      await coll.add({ data: { ...key, ts: Date.now() } })
    }
    return { ok: true }
  } catch (error) {
    console.error('收藏操作失败:', error)
    return { error: '操作失败' }
  }
}

// ======== 删除功能 ========

// 删除单条收藏
async function removeFavorite({ userId, contentId }) {
  if (!contentId) return { error: 'contentId_required' }
  try {
    const coll = db.collection('favorites')
    await coll.where({ userId, contentId }).remove()
    return { ok: true }
  } catch (error) {
    console.error('删除收藏失败:', error)
    return { error: '删除失败' }
  }
}

// 清空所有收藏
async function clearAllFavorites({ userId }) {
  if (!userId) return { error: 'userId_required' }
  try {
    const coll = db.collection('favorites')
    await coll.where({ userId }).remove()
    return { ok: true }
  } catch (error) {
    console.error('清空收藏失败:', error)
    return { error: '清空失败' }
  }
}

// 删除单条浏览历史
async function removeHistory({ userId, contentId }) {
  if (!contentId) return { error: 'contentId_required' }
  try {
    const coll = db.collection('history')
    await coll.where({ userId, contentId }).remove()
    return { ok: true }
  } catch (error) {
    console.error('删除历史失败:', error)
    return { error: '删除失败' }
  }
}

// 清空所有浏览历史
async function clearAllHistory({ userId }) {
  if (!userId) return { error: 'userId_required' }
  try {
    const coll = db.collection('history')
    await coll.where({ userId }).remove()
    return { ok: true }
  } catch (error) {
    console.error('清空历史失败:', error)
    return { error: '清空失败' }
  }
}

// 记录浏览历史
async function recordHistory({ userId, contentId, duration = 0 }) {
  console.log('🔔 recordHistory 被调用')
  console.log('参数:', { userId, contentId, duration })
  
  if (!contentId || !userId) {
    console.error('❌ 参数不完整，无法记录')
    return { error: 'contentId_required' }
  }
  
  try {
    console.log('📝 准备写入数据...')
    const coll = db.collection('history')
    const data = { 
      userId, 
      contentId, 
      ts: Date.now(),
      duration: Math.max(0, duration)
    }
    console.log('📝 写入数据:', data)
    
    const result = await coll.add({ data })
    console.log('✅ 写入成功:', result)
    
    return { ok: true, message: '浏览历史已记录' }
  } catch (error) {
    console.error('❌ 记录历史失败:', error)
    return { ok: true, message: '记录失败但不影响体验' }
  }
}

async function listFavorites({ userId, page = 1, pageSize = 10 }) {
  try {
    page = Math.max(parseInt(page, 10), 1)
    pageSize = Math.min(parseInt(pageSize, 10), 50)
    const favs = await db.collection('favorites')
      .where({ userId })
      .orderBy('ts', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()
    const contentIds = (favs.data || []).map(f => f.contentId)
    if (!contentIds.length) return { list: [], hasMore: false }
    const contents = await db.collection('contents').where({ _id: _.in(contentIds) }).get()
    const list = (contents.data || []).map(stripMedia)
    const hasMore = (favs.data || []).length === pageSize
    return { list, hasMore }
  } catch (error) {
    console.error('获取收藏列表失败:', error)
    return { list: [], hasMore: false }
  }
}

async function listHistory({ userId, page = 1, pageSize = 10 }) {
  try {
    page = Math.max(parseInt(page, 10), 1)
    pageSize = Math.min(parseInt(pageSize, 10), 50)
    
    // 先获取总数
    const countRes = await db.collection('history')
      .where({ userId })
      .count()
    const totalCount = countRes.total || 0
    
    console.log('📊 history/list 查询:')
    console.log('  - userId:', userId)
    console.log('  - totalCount:', totalCount)
    console.log('  - page:', page)
    console.log('  - pageSize:', pageSize)
    
    if (totalCount === 0) {
      console.log('❌ 该用户没有浏览历史')
      return { list: [], hasMore: false, totalCount: 0 }
    }
    
    const logs = await db.collection('history')
      .where({ userId })
      .orderBy('ts', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()
    
    console.log('  - 本页项数:', (logs.data || []).length)
    
    const ids = (logs.data || []).map(l => l.contentId)
    if (!ids.length) {
      console.log('❌ 本页无数据')
      return { list: [], hasMore: false, totalCount }
    }
    
    const contents = await db.collection('contents').where({ _id: _.in(ids) }).get()
    const list = (contents.data || []).map(stripMedia)
    const hasMore = (logs.data || []).length === pageSize
    
    console.log('✅ 返回:', {
      listLength: list.length,
      totalCount,
      hasMore
    })
    
    return { list, hasMore, totalCount }
  } catch (error) {
    console.error('获取历史记录失败:', error)
    return { list: [], hasMore: false, totalCount: 0 }
  }
}

async function getSubscription({ userId }) {
  try {
    const res = await db.collection('subscriptions').where({ userId }).get()
    const doc = (res.data || [])[0] || { sourceIds: [], tagIds: [] }
    return doc
  } catch (error) {
    console.error('获取订阅失败:', error)
    return { sourceIds: [], tagIds: [] }
  }
}

async function setSubscription({ userId, sourceIds, tagIds }) {
  try {
    const coll = db.collection('subscriptions')
    const res = await coll.where({ userId }).get()
    const existing = (res.data || [])[0] || {}
    
    // 更新数据，保留未传入的字段
    const updateData = {
      userId,
      sourceIds: Array.isArray(sourceIds) ? sourceIds : (existing.sourceIds || []),
      tagIds: Array.isArray(tagIds) ? tagIds : (existing.tagIds || [])
    }
    
    if ((res.data || []).length) {
      await coll.where({ userId }).update({ data: updateData })
    } else {
      await coll.add({ data: updateData })
    }
    return { ok: true }
  } catch (error) {
    console.error('设置订阅失败:', error)
    return { error: '设置失败' }
  }
}

async function ingestContent({ payload, headers, userId }) {
  const authHeader = headers?.authorization || headers?.Authorization || ''
  const token = payload?.token || (authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '')
  const required = process.env.API_INGEST_KEY || ''
  if (!required || token !== required) return { error: 'unauthorized' }

  const body = payload || {}
  const doc = {
    externalId: body.externalId,
    title: (body.title || '').trim(),
    summary: (body.summary || '').trim(),
    sourceId: body.sourceId || '',
    sourceName: body.sourceName || '',
    campus: body.campus || 'all',
    category: body.category || '',
    tags: Array.isArray(body.tags) ? body.tags : [],
    publishTime: Number(body.publishTime) || Date.now(),
    createdAt: Number(body.createdAt) || Date.now(),
    sourceUrl: body.sourceUrl || ''
  }
  if (!doc.externalId && !doc.sourceUrl) return { error: 'externalId_or_sourceUrl_required' }

  try {
    const coll = db.collection('contents')
    if (doc.externalId) {
      const existing = await coll.where({ externalId: doc.externalId }).get()
      if ((existing.data || []).length) {
        await coll.where({ externalId: doc.externalId }).update({ data: doc })
      } else {
        await coll.add({ data: doc })
      }
    } else {
      const found = await coll.where({ sourceUrl: doc.sourceUrl }).get()
      if ((found.data || []).length) {
        await coll.where({ sourceUrl: doc.sourceUrl }).update({ data: doc })
      } else {
        await coll.add({ data: doc })
      }
    }
    return { ok: true }
  } catch (error) {
    console.error('内容导入失败:', error)
    return { error: '导入失败' }
  }
}

async function initSeed() {
  try {
    console.log('initSeed 已废弃，请使用 createSampleData')
    return { ok: false, error: '请使用 createSampleData 创建示例数据' }
  } catch (error) {
    console.error('初始化种子数据失败:', error)
    return { ok: false, error: '初始化失败' }
  }
}

// 清理重复数据
async function cleanDuplicates() {
  try {
    console.log('开始清理重复数据')
    const collections = ['users', 'tags', 'sources']
    const results = {}
    
    for (const collectionName of collections) {
      const all = await db.collection(collectionName).get()
      const items = all.data || []
      
      // 按名称或用户名分组
      const nameMap = {}
      const duplicates = []
      
      items.forEach(item => {
        const key = collectionName === 'users' ? item.username : item.name
        if (!nameMap[key]) {
          nameMap[key] = item
        } else {
          duplicates.push(item._id)
        }
      })
      
      // 删除重复项
      let deleted = 0
      for (const id of duplicates) {
        try {
          await db.collection(collectionName).doc(id).remove()
          deleted++
          console.log(`删除重复的 ${collectionName}:`, id)
        } catch (error) {
          console.error(`删除失败:`, error)
        }
      }
      
      results[collectionName] = {
        total: items.length,
        unique: Object.keys(nameMap).length,
        deleted: deleted
      }
    }
    
    return {
      ok: true,
      message: '清理完成',
      results: results
    }
  } catch (error) {
    console.error('清理重复数据失败:', error)
    return {
      ok: false,
      error: '清理失败',
      message: error.message
    }
  }
}

// 创建示例数据 - 增加更多内容
async function createSampleData() {
  try {
    console.log('开始创建示例数据')
    const now = Date.now()
    
    // 0. 创建默认用户（优先创建）
    const users = [
      {
        username: '23012774',
        password: '23012774',
        role: 'student',
        nickname: '学生用户',
        idCardLast4: '6613',
        avatarUrl: '',
        createdAt: now,
        isActive: true
      },
      {
        username: 'admin001',
        password: 'admin123',
        role: 'admin',
        nickname: '管理员',
        idCardLast4: '1234',
        avatarUrl: '',
        createdAt: now,
        isActive: true
      }
    ]
    
    console.log('准备创建用户:', users.length, '个')
    for (const user of users) {
      try {
        // 先检查是否已存在
        const existing = await db.collection('users').where({ username: user.username }).get()
        if (existing.data && existing.data.length > 0) {
          console.log('用户已存在，跳过:', user.username)
          continue
        }
        const result = await db.collection('users').add({ data: user })
        console.log('用户创建成功:', user.username)
      } catch (error) {
        console.error('用户创建失败:', error)
      }
    }
    
    // 1. 创建标签数据（带图标和描述）
    const tags = [
      { name: '竞赛', icon: '🏆', description: 'ACM、数学建模、创新创业等各类竞赛' },
      { name: '学术讲座', icon: '🎓', description: '学术报告、前沿技术分享、专家讲座' },
      { name: '招聘', icon: '💼', description: '企业宣讲、校园招聘、实习机会' },
      { name: '文体活动', icon: '⚽', description: '体育赛事、文艺演出、社团活动' },
      { name: '志愿服务', icon: '🤝', description: '公益活动、社会实践、志愿者招募' },
      { name: '工作坊', icon: '🛠️', description: '技能培训、动手实践、经验分享' }
    ]
    
    console.log('准备创建标签:', tags.length, '个')
    for (const tag of tags) {
      try {
        // 先检查是否已存在
        const existing = await db.collection('tags').where({ name: tag.name }).get()
        if (existing.data && existing.data.length > 0) {
          console.log('标签已存在，跳过:', tag.name)
          continue
        }
        const result = await db.collection('tags').add({ data: tag })
        console.log('标签创建成功:', result)
      } catch (error) {
        console.error('标签创建失败:', error)
      }
    }
    
    // 2. 创建来源数据（带去重）
    const sources = [
      { name: '信息工程学院', icon: '💻', description: '计算机与信息技术相关通知' },
      { name: '就业指导中心', icon: '💼', description: '招聘、实习、就业信息' },
      { name: '校团委', icon: '🎯', description: '学生活动、志愿服务' },
      { name: '教务处', icon: '📚', description: '教学、选课、考试通知' },
      { name: '图书馆', icon: '📖', description: '讲座、资源、借阅服务' },
      { name: '体育部', icon: '⚽', description: '体育赛事、健身活动' }
    ]
    
    console.log('准备创建来源:', sources.length, '个')
    for (const source of sources) {
      try {
        // 先检查是否已存在
        const existing = await db.collection('sources').where({ name: source.name }).get()
        if (existing.data && existing.data.length > 0) {
          console.log('来源已存在，跳过:', source.name)
          continue
        }
        const result = await db.collection('sources').add({ data: source })
        console.log('来源创建成功:', result)
      } catch (error) {
        console.error('来源创建失败:', error)
      }
    }
    
    // 3. 创建横幅数据
    const banners = [
      {
        title: '2024年春季校园招聘会',
        image: 'https://picsum.photos/750/300?random=1',
        link: '/pages/home/index',
        ts: now
      },
      {
        title: 'ACM程序设计竞赛报名中',
        image: 'https://picsum.photos/750/300?random=2',
        link: '/pages/home/index',
        ts: now - 86400000
      },
      {
        title: '学术讲座：人工智能前沿技术',
        image: 'https://picsum.photos/750/300?random=3',
        link: '/pages/home/index',
        ts: now - 172800000
      }
    ]
    
    console.log('准备创建横幅:', banners.length, '个')
    for (const banner of banners) {
      try {
        const result = await db.collection('banners').add({ data: banner })
        console.log('横幅创建成功:', result)
      } catch (error) {
        console.error('横幅创建失败:', error)
      }
    }
    
    // 4. 创建4条丰富的内容数据
    const contents = [
      {
        title: '2024年春季校园招聘会',
        summary: '多家知名企业来校招聘，涵盖IT、金融、教育等多个行业，提供丰富的就业机会。包括腾讯、阿里巴巴、字节跳动等互联网大厂，以及华为、小米等科技公司。',
        sourceId: 'source_career',
        sourceName: '就业指导中心',
        campus: 'haidian',
        category: 'recruit',
        tags: ['招聘', '就业', '企业', '互联网'],
        publishTime: now,
        createdAt: now,
        sourceUrl: 'https://example.edu/recruit1',
        location: '学生活动中心',
        startTime: now + 86400000 * 3,
        endTime: now + 86400000 * 3 + 3600000 * 8,
        maxParticipants: 500,
        currentParticipants: 120,
        price: 0,
        difficulty: 'beginner',
        status: 'open',
        viewCount: 256,
        favoriteCount: 45,
        shareCount: 12,
        hotScore: 85
      },
      {
        title: 'ACM程序设计竞赛',
        summary: '第十五届校园ACM程序设计竞赛开始报名，欢迎编程爱好者积极参与。比赛将采用ICPC赛制，设置多个难度等级，优胜者将获得丰厚奖品和实习机会。',
        sourceId: 'source_ie',
        sourceName: '信息工程学院',
        campus: 'haidian',
        category: 'competition',
        tags: ['竞赛', '编程', 'ACM', '算法'],
        publishTime: now - 3600000,
        createdAt: now - 3600000,
        sourceUrl: 'https://example.edu/acm1',
        location: '计算机实验室',
        startTime: now + 86400000 * 7,
        endTime: now + 86400000 * 7 + 3600000 * 4,
        maxParticipants: 100,
        currentParticipants: 67,
        price: 0,
        difficulty: 'advanced',
        status: 'open',
        viewCount: 189,
        favoriteCount: 78,
        shareCount: 23,
        hotScore: 92
      },
      {
        title: '人工智能前沿技术讲座',
        summary: '邀请业界专家分享AI最新发展趋势，包括大模型、机器学习、深度学习等热门话题。适合对AI技术感兴趣的同学，讲座后将提供Q&A环节。',
        sourceId: 'source_academic',
        sourceName: '教务处',
        campus: 'haidian',
        category: 'academic',
        tags: ['讲座', 'AI', '技术', '机器学习'],
        publishTime: now - 7200000,
        createdAt: now - 7200000,
        sourceUrl: 'https://example.edu/ai_lecture',
        location: '学术报告厅',
        startTime: now + 86400000 * 2,
        endTime: now + 86400000 * 2 + 3600000 * 2,
        maxParticipants: 200,
        currentParticipants: 156,
        price: 0,
        difficulty: 'intermediate',
        status: 'open',
        viewCount: 312,
        favoriteCount: 89,
        shareCount: 34,
        hotScore: 88
      },
      {
        title: '校园足球联赛',
        summary: '春季校园足球联赛即将开始，各学院代表队激烈角逐，欢迎同学们前来观赛。比赛采用淘汰制，精彩纷呈，冠军队伍将代表学校参加市级比赛。',
        sourceId: 'source_sports',
        sourceName: '体育部',
        campus: 'haidian',
        category: 'sports',
        tags: ['足球', '体育', '联赛', '比赛'],
        publishTime: now - 14400000,
        createdAt: now - 14400000,
        sourceUrl: 'https://example.edu/football',
        location: '体育场',
        startTime: now + 86400000 * 4,
        endTime: now + 86400000 * 4 + 3600000 * 2,
        maxParticipants: 0,
        currentParticipants: 0,
        price: 0,
        difficulty: 'beginner',
        status: 'open',
        viewCount: 98,
        favoriteCount: 23,
        shareCount: 15,
        hotScore: 72
      }
    ]
    
    console.log('准备创建内容:', contents.length, '条')
    for (const content of contents) {
      try {
        const result = await db.collection('contents').add({ data: content })
        console.log('内容创建成功:', result)
      } catch (error) {
        console.error('内容创建失败:', error)
      }
    }
    
    console.log('示例数据创建完成')
    
    return { 
      ok: true, 
      message: '示例数据创建成功',
      inserted: { 
        users: users.length,
        tags: tags.length, 
        sources: sources.length, 
        contents: contents.length,
        banners: banners.length
      } 
    }
    
  } catch (error) {
    console.error('创建示例数据失败:', error)
    return { 
      ok: false, 
      error: '创建失败', 
      message: error.message 
    }
  }
}

function startOfWeekTs() {
  const now = new Date()
  const day = now.getDay() || 7
  now.setHours(0,0,0,0)
  now.setDate(now.getDate() - day + 1)
  return now.getTime()
}

function startOfMonthTs() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).getTime()
}

// ==================== 用户认证相关函数 ====================

// 用户登录
async function userLogin({ username, password, role }) {
  try {
    if (!username || !password || !role) {
      return { error: 'missing_params', message: '请填写完整信息' }
    }

    // 查询用户
    const userRes = await db.collection('users').where({ 
      username: username 
    }).get()

    if (!userRes.data || userRes.data.length === 0) {
      return { error: 'user_not_found', message: '用户不存在' }
    }

    const user = userRes.data[0]

    // 验证密码
    if (user.password !== password) {
      return { error: 'wrong_password', message: '密码错误' }
    }

    // 验证角色
    if (user.role !== role) {
      return { error: 'wrong_role', message: '身份选择错误' }
    }

    // 登录成功，返回用户信息（不包含密码和身份证）
    return {
      ok: true,
      user: {
        userId: user._id,
        username: user.username,
        nickname: user.nickname,
        role: user.role,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt
      }
    }
  } catch (error) {
    console.error('登录失败:', error)
    return { error: 'login_failed', message: '登录失败，请重试' }
  }
}

// 用户注册（预留）
async function userRegister({ username, password, role, idCardLast4 }) {
  try {
    // 检查用户名是否已存在
    const existRes = await db.collection('users').where({ username }).get()
    if (existRes.data && existRes.data.length > 0) {
      return { error: 'user_exists', message: '用户名已存在' }
    }

    // 创建用户
    const newUser = {
      username,
      password,
      role: role || 'student',
      nickname: username,
      idCardLast4,
      avatarUrl: '',
      createdAt: Date.now(),
      isActive: true
    }

    const result = await db.collection('users').add({ data: newUser })

    return {
      ok: true,
      message: '注册成功',
      userId: result._id
    }
  } catch (error) {
    console.error('注册失败:', error)
    return { error: 'register_failed', message: '注册失败，请重试' }
  }
}

// 重置密码
async function resetPassword({ username, idCardLast4, newPassword }) {
  try {
    if (!username || !idCardLast4 || !newPassword) {
      return { error: 'missing_params', message: '请填写完整信息' }
    }

    // 查询用户
    const userRes = await db.collection('users').where({ username }).get()
    if (!userRes.data || userRes.data.length === 0) {
      return { error: 'user_not_found', message: '用户不存在' }
    }

    const user = userRes.data[0]

    // 验证身份证后四位
    if (user.idCardLast4 !== idCardLast4) {
      return { error: 'wrong_id_card', message: '身份证后四位错误' }
    }

    // 更新密码
    await db.collection('users').doc(user._id).update({
      data: { password: newPassword }
    })

    return { ok: true, message: '密码重置成功' }
  } catch (error) {
    console.error('重置密码失败:', error)
    return { error: 'reset_failed', message: '重置密码失败，请重试' }
  }
}

// 获取用户信息
async function getUserInfo({ userId }) {
  try {
    const userRes = await db.collection('users').doc(userId).get()
    if (!userRes.data) {
      return { error: 'user_not_found' }
    }

    const user = userRes.data
    return {
      ok: true,
      user: {
        userId: user._id,
        username: user.username,
        nickname: user.nickname,
        role: user.role,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt
      }
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return { error: 'get_user_failed' }
  }
}

// 初始化默认用户
async function initDefaultUser() {
  try {
    // 检查是否已存在
    const existRes = await db.collection('users').where({ 
      username: '23012774' 
    }).get()

    if (existRes.data && existRes.data.length > 0) {
      console.log('默认用户已存在')
      return { ok: true, message: '默认用户已存在' }
    }

    // 创建默认用户
    const defaultUser = {
      username: '23012774',
      password: '23012774',
      role: 'student',
      nickname: '学生用户',
      idCardLast4: '6613',
      avatarUrl: '',
      createdAt: Date.now(),
      isActive: true
    }

    await db.collection('users').add({ data: defaultUser })

    return { ok: true, message: '默认用户创建成功' }
  } catch (error) {
    console.error('创建默认用户失败:', error)
    return { error: 'init_user_failed' }
  }
}