/**
 * 用户数据绑定统一实现 - 云函数代码模块
 * 
 * 本文件包含所有与用户数据绑定相关的核心函数
 * 直接复制到 cloudfunctions/api/index.js 中使用
 */

// ============================================================================
// 0. 数据库初始化
// ============================================================================

async function initUserDataCollections() {
  try {
    console.log('开始初始化用户数据集合')
    
    // 创建 userProfiles 集合
    try {
      await db.createCollection('userProfiles')
      console.log('userProfiles 集合创建成功')
    } catch (e) {
      if (e.message.includes('exist')) {
        console.log('userProfiles 集合已存在')
      } else {
        throw e
      }
    }
    
    // 创建索引
    await db.collection('userProfiles').createIndex({ 
      userId: 1 
    }, { 
      unique: true, 
      name: 'uk_user_profile' 
    })
    
    await db.collection('favorites').createIndex({ 
      userId: 1, contentId: 1 
    }, { 
      unique: true, 
      name: 'uk_user_content' 
    })
    
    await db.collection('history').createIndex({ 
      userId: 1, ts: -1 
    }, { 
      name: 'idx_history_user_ts' 
    })
    
    console.log('索引创建成功')
    
    return { ok: true, message: '用户数据集合初始化完成' }
  } catch (error) {
    console.error('初始化失败:', error)
    return { ok: false, error: error.message }
  }
}

// ============================================================================
// 1. 获取用户完整资料
// ============================================================================

/**
 * 获取用户的完整资料（订阅、收藏、历史、统计）
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} 用户资料对象
 */
async function getUserProfile({ userId }) {
  try {
    if (!userId) {
      return {
        userId: 'unknown',
        subscriptions: { tagIds: [], sourceIds: [] },
        favorites: { contentIds: [], count: 0 },
        history: { recentIds: [], totalCount: 0 }
      }
    }

    const res = await db.collection('userProfiles')
      .where({ userId })
      .get()
    
    const profile = (res.data || [])[0] || {
      userId,
      subscriptions: { tagIds: [], sourceIds: [] },
      favorites: { contentIds: [], count: 0 },
      history: { recentIds: [], totalCount: 0 }
    }
    
    return profile
  } catch (error) {
    console.error('获取用户资料失败:', error)
    return {
      userId,
      subscriptions: { tagIds: [], sourceIds: [] },
      favorites: { contentIds: [], count: 0 },
      history: { recentIds: [], totalCount: 0 }
    }
  }
}

// ============================================================================
// 2. 用户订阅管理
// ============================================================================

/**
 * 获取用户订阅
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} 用户订阅数据
 */
async function getSubscription({ userId }) {
  try {
    const profile = await getUserProfile({ userId })
    return profile.subscriptions || { tagIds: [], sourceIds: [] }
  } catch (error) {
    console.error('获取订阅失败:', error)
    return { tagIds: [], sourceIds: [] }
  }
}

/**
 * 设置用户订阅
 * @param {string} userId - 用户ID
 * @param {Array} tagIds - 标签ID数组
 * @param {Array} sourceIds - 来源ID数组
 * @returns {Promise<Object>} 操作结果
 */
async function setSubscription({ userId, tagIds, sourceIds }) {
  try {
    if (!userId) return { error: 'userId_required' }

    const coll = db.collection('userProfiles')
    const res = await coll.where({ userId }).get()
    const existing = (res.data || [])[0] || {}
    
    const updateData = {
      userId,
      subscriptions: {
        tagIds: Array.isArray(tagIds) ? tagIds : (existing.subscriptions?.tagIds || []),
        sourceIds: Array.isArray(sourceIds) ? sourceIds : (existing.subscriptions?.sourceIds || []),
        updatedAt: Date.now()
      },
      favorites: existing.favorites || { contentIds: [], count: 0 },
      history: existing.history || { recentIds: [], totalCount: 0 }
    }
    
    if (res.data && res.data.length) {
      await coll.where({ userId }).update({ data: updateData })
    } else {
      await coll.add({ data: updateData })
    }
    
    return { ok: true, data: updateData.subscriptions }
  } catch (error) {
    console.error('设置订阅失败:', error)
    return { error: '设置失败', message: error.message }
  }
}

// ============================================================================
// 3. 用户收藏管理
// ============================================================================

/**
 * 切换收藏状态（添加/移除）
 * @param {string} userId - 用户ID
 * @param {string} contentId - 内容ID
 * @returns {Promise<Object>} 操作结果
 */
async function toggleFavorite({ userId, contentId }) {
  if (!contentId) return { error: 'contentId_required' }
  if (!userId) return { error: 'userId_required' }
  
  try {
    // 1. 更新详细收藏表（用于审计和分析）
    const favsColl = db.collection('favorites')
    const exists = await favsColl.where({ userId, contentId }).get()
    
    const isFavorited = exists.data && exists.data.length > 0
    
    if (isFavorited) {
      await favsColl.where({ userId, contentId }).remove()
    } else {
      await favsColl.add({ 
        data: { userId, contentId, ts: Date.now() } 
      })
    }
    
    // 2. 更新用户资料表的收藏列表
    const profileColl = db.collection('userProfiles')
    const profileRes = await profileColl.where({ userId }).get()
    const existing = (profileRes.data || [])[0] || {}
    
    let contentIds = existing.favorites?.contentIds || []
    
    if (isFavorited) {
      // 移除
      contentIds = contentIds.filter(id => id !== contentId)
    } else {
      // 添加
      if (!contentIds.includes(contentId)) {
        contentIds.unshift(contentId)  // 最新的在前
        // 限制最多保留200条
        if (contentIds.length > 200) contentIds = contentIds.slice(0, 200)
      }
    }
    
    const updateData = {
      userId,
      subscriptions: existing.subscriptions || { tagIds: [], sourceIds: [] },
      favorites: {
        contentIds,
        count: contentIds.length,
        updatedAt: Date.now()
      },
      history: existing.history || { recentIds: [], totalCount: 0 }
    }
    
    if (profileRes.data && profileRes.data.length) {
      await profileColl.where({ userId }).update({ data: updateData })
    } else {
      await profileColl.add({ data: updateData })
    }
    
    return { ok: true, favorited: !isFavorited, count: contentIds.length }
  } catch (error) {
    console.error('收藏操作失败:', error)
    return { error: '操作失败', message: error.message }
  }
}

/**
 * 获取用户收藏列表（分页）
 * @param {string} userId - 用户ID
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @returns {Promise<Object>} 收藏列表和分页信息
 */
async function listFavorites({ userId, page = 1, pageSize = 10 }) {
  try {
    if (!userId) return { list: [], hasMore: false, totalCount: 0 }

    page = Math.max(parseInt(page, 10), 1)
    pageSize = Math.min(parseInt(pageSize, 10), 50)
    
    // 1. 从用户资料获取收藏ID列表
    const profileRes = await db.collection('userProfiles')
      .where({ userId })
      .get()
    const profile = (profileRes.data || [])[0]
    const contentIds = profile?.favorites?.contentIds || []
    const totalCount = contentIds.length
    
    if (!contentIds.length) return { list: [], hasMore: false, totalCount: 0 }
    
    // 2. 分页获取
    const paginatedIds = contentIds
      .slice((page - 1) * pageSize, page * pageSize)
    
    if (!paginatedIds.length) return { list: [], hasMore: false, totalCount }
    
    // 3. 获取内容详情
    const contents = await db.collection('contents')
      .where({ _id: db.command.in(paginatedIds) })
      .get()
    
    const list = (contents.data || [])
      .map(stripMedia)
      .sort((a, b) => paginatedIds.indexOf(a._id) - paginatedIds.indexOf(b._id))
    
    const hasMore = page * pageSize < totalCount
    
    return { list, hasMore, totalCount, page, pageSize }
  } catch (error) {
    console.error('获取收藏列表失败:', error)
    return { list: [], hasMore: false, totalCount: 0 }
  }
}

// ============================================================================
// 4. 用户浏览历史管理
// ============================================================================

/**
 * 记录浏览历史
 * @param {string} userId - 用户ID
 * @param {string} contentId - 内容ID
 * @param {number} duration - 浏览时长（毫秒，可选）
 * @returns {Promise<Object>} 操作结果
 */
async function recordHistory({ userId, contentId, duration = 0 }) {
  if (!contentId) return { error: 'contentId_required' }
  if (!userId) return { error: 'userId_required' }
  
  try {
    // 1. 添加详细历史记录
    const historyColl = db.collection('history')
    await historyColl.add({ 
      data: { 
        userId, 
        contentId, 
        ts: Date.now(),
        duration  // 可选的浏览时长
      } 
    })
    
    // 2. 更新用户资料表的历史记录
    const profileColl = db.collection('userProfiles')
    const profileRes = await profileColl.where({ userId }).get()
    const existing = (profileRes.data || [])[0] || {}
    
    let recentIds = existing.history?.recentIds || []
    
    // 移除旧的相同记录，添加到最前面
    recentIds = recentIds.filter(id => id !== contentId)
    recentIds.unshift(contentId)
    
    // 只保留最近50条
    if (recentIds.length > 50) recentIds = recentIds.slice(0, 50)
    
    const updateData = {
      userId,
      subscriptions: existing.subscriptions || { tagIds: [], sourceIds: [] },
      favorites: existing.favorites || { contentIds: [], count: 0 },
      history: {
        recentIds,
        totalCount: (existing.history?.totalCount || 0) + 1,
        updatedAt: Date.now()
      }
    }
    
    if (profileRes.data && profileRes.data.length) {
      await profileColl.where({ userId }).update({ data: updateData })
    } else {
      await profileColl.add({ data: updateData })
    }
    
    return { ok: true, totalCount: updateData.history.totalCount }
  } catch (error) {
    console.error('记录历史失败:', error)
    return { error: '记录失败', message: error.message }
  }
}

/**
 * 获取用户浏览历史列表（分页）
 * @param {string} userId - 用户ID
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @returns {Promise<Object>} 历史列表和分页信息
 */
async function listHistory({ userId, page = 1, pageSize = 10 }) {
  try {
    if (!userId) return { list: [], hasMore: false, totalCount: 0 }

    page = Math.max(parseInt(page, 10), 1)
    pageSize = Math.min(parseInt(pageSize, 10), 50)
    
    // 1. 从用户资料获取最近浏览的ID
    const profileRes = await db.collection('userProfiles')
      .where({ userId })
      .get()
    const profile = (profileRes.data || [])[0]
    const recentIds = profile?.history?.recentIds || []
    const totalCount = profile?.history?.totalCount || 0
    
    // 2. 分页获取
    const paginatedIds = recentIds
      .slice((page - 1) * pageSize, page * pageSize)
    
    if (!paginatedIds.length) return { list: [], hasMore: false, totalCount }
    
    // 3. 获取内容详情
    const contents = await db.collection('contents')
      .where({ _id: db.command.in(paginatedIds) })
      .get()
    
    const list = (contents.data || [])
      .map(stripMedia)
      .sort((a, b) => paginatedIds.indexOf(a._id) - paginatedIds.indexOf(b._id))
    
    const hasMore = page * pageSize < recentIds.length
    
    return { list, hasMore, totalCount, page, pageSize }
  } catch (error) {
    console.error('获取历史列表失败:', error)
    return { list: [], hasMore: false, totalCount: 0 }
  }
}

/**
 * 清空用户浏览历史
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} 操作结果
 */
async function clearHistory({ userId }) {
  try {
    if (!userId) return { error: 'userId_required' }

    const profileColl = db.collection('userProfiles')
    const profileRes = await profileColl.where({ userId }).get()
    const existing = (profileRes.data || [])[0] || {}
    
    const updateData = {
      userId,
      subscriptions: existing.subscriptions || { tagIds: [], sourceIds: [] },
      favorites: existing.favorites || { contentIds: [], count: 0 },
      history: {
        recentIds: [],
        totalCount: 0,
        updatedAt: Date.now()
      }
    }
    
    if (profileRes.data && profileRes.data.length) {
      await profileColl.where({ userId }).update({ data: updateData })
    }
    
    return { ok: true, message: '历史已清空' }
  } catch (error) {
    console.error('清空历史失败:', error)
    return { error: '清空失败', message: error.message }
  }
}

// ============================================================================
// 5. 数据迁移
// ============================================================================

/**
 * 从旧的分散存储迁移到新的统一存储
 * @returns {Promise<Object>} 迁移结果统计
 */
async function migrateToUserProfiles() {
  try {
    console.log('开始迁移用户数据到 userProfiles')
    
    // 1. 获取所有用户
    const usersRes = await db.collection('users').get()
    const users = usersRes.data || []
    
    let successCount = 0
    let errorCount = 0
    const errors = []
    
    // 2. 为每个用户创建 profile
    for (const user of users) {
      try {
        const userId = user._id || user.username
        
        // 获取用户的收藏
        const favsRes = await db.collection('favorites')
          .where({ userId })
          .get()
        const favoriteIds = (favsRes.data || []).map(f => f.contentId)
        
        // 获取用户的历史
        const historyRes = await db.collection('history')
          .where({ userId })
          .orderBy('ts', 'desc')
          .limit(50)
          .get()
        const historyIds = (historyRes.data || []).map(h => h.contentId)
        
        // 获取用户的订阅
        const subsRes = await db.collection('subscriptions')
          .where({ userId })
          .get()
        const subscription = (subsRes.data || [])[0] || {}
        
        // 获取总浏览次数
        const totalHistoryRes = await db.collection('history')
          .where({ userId })
          .count()
        const totalCount = totalHistoryRes.total || 0
        
        // 创建用户资料
        const profileData = {
          userId,
          subscriptions: {
            tagIds: subscription.tagIds || [],
            sourceIds: subscription.sourceIds || []
          },
          favorites: {
            contentIds: favoriteIds,
            count: favoriteIds.length
          },
          history: {
            recentIds: historyIds,
            totalCount
          }
        }
        
        // 检查是否已存在
        const existingProfile = await db.collection('userProfiles')
          .where({ userId })
          .get()
        
        if (existingProfile.data && existingProfile.data.length > 0) {
          // 更新
          await db.collection('userProfiles')
            .where({ userId })
            .update({ data: profileData })
        } else {
          // 创建
          await db.collection('userProfiles').add({ data: profileData })
        }
        
        successCount++
        console.log(`✅ 用户 ${userId} 迁移成功`)
      } catch (err) {
        errorCount++
        errors.push(err.message)
        console.error(`❌ 用户迁移失败:`, err)
      }
    }
    
    return {
      ok: true,
      message: `迁移完成: ${successCount} 成功, ${errorCount} 失败`,
      successCount,
      errorCount,
      errors: errors.slice(0, 10)  // 只返回前10个错误
    }
  } catch (error) {
    console.error('迁移失败:', error)
    return { error: '迁移失败', message: error.message }
  }
}

// ============================================================================
// 6. 数据统计和分析
// ============================================================================

/**
 * 获取用户数据统计信息
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} 统计数据
 */
async function getUserStats({ userId }) {
  try {
    if (!userId) return {}

    const profile = await getUserProfile({ userId })
    
    return {
      subscriptions: {
        tags: profile.subscriptions?.tagIds?.length || 0,
        sources: profile.subscriptions?.sourceIds?.length || 0
      },
      favorites: {
        count: profile.favorites?.count || 0
      },
      history: {
        recentCount: profile.history?.recentIds?.length || 0,
        totalCount: profile.history?.totalCount || 0
      }
    }
  } catch (error) {
    console.error('获取统计失败:', error)
    return {}
  }
}

/**
 * 获取系统级统计（需要管理员权限）
 * @returns {Promise<Object>} 系统统计数据
 */
async function getSystemStats() {
  try {
    const profilesRes = await db.collection('userProfiles').get()
    const profiles = profilesRes.data || []
    
    let totalSubscriptions = 0
    let totalFavorites = 0
    let totalHistory = 0
    let avgSubscriptions = 0
    let avgFavorites = 0
    
    profiles.forEach(profile => {
      totalSubscriptions += profile.subscriptions?.tagIds?.length || 0
      totalFavorites += profile.favorites?.count || 0
      totalHistory += profile.history?.totalCount || 0
    })
    
    const profileCount = profiles.length
    if (profileCount > 0) {
      avgSubscriptions = (totalSubscriptions / profileCount).toFixed(2)
      avgFavorites = (totalFavorites / profileCount).toFixed(2)
    }
    
    return {
      totalProfiles: profileCount,
      totalSubscriptions,
      totalFavorites,
      totalHistory,
      avgSubscriptions: parseFloat(avgSubscriptions),
      avgFavorites: parseFloat(avgFavorites),
      avgHistory: profileCount > 0 ? (totalHistory / profileCount).toFixed(2) : 0
    }
  } catch (error) {
    console.error('获取系统统计失败:', error)
    return {}
  }
}

// ============================================================================
// 7. 辅助函数
// ============================================================================

/**
 * 移除媒体字段（保护隐私的大型字段）
 */
function stripMedia(doc) {
  const { coverUrl, posterUrl, ...rest } = doc || {}
  return rest
}

// ============================================================================
// 导出所有函数（用于路由配置）
// ============================================================================

module.exports = {
  initUserDataCollections,
  getUserProfile,
  getSubscription,
  setSubscription,
  toggleFavorite,
  listFavorites,
  recordHistory,
  listHistory,
  clearHistory,
  migrateToUserProfiles,
  getUserStats,
  getSystemStats
}
