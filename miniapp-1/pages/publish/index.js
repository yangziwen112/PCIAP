import { callApi, toast } from '../../utils/request'
import { isAdmin, getUserId } from '../../utils/auth'

Page({
  data: {
    // 表单数据
    title: '',
    description: '',
    selectedTags: [],
    selectedSource: '',
    images: [],
    
    // 元数据
    tags: [],
    sources: [],
    
    // UI 状态
    loading: false,
    publishing: false,
    
    // 权限检查
    isAdmin: false,
    isLoggedIn: false
  },

  onLoad() {
    // 权限检查
    if (!isAdmin()) {
      wx.showModal({
        title: '权限不足',
        content: '只有管理员才能发布信息',
        showCancel: false,
        success: () => {
          wx.navigateBack()
        }
      })
      return
    }
    
    this.setData({ isAdmin: true })
    this.loadMetadata()
  },

  // 加载标签和来源
  async loadMetadata() {
    try {
      this.setData({ loading: true })
      const [tagsRes, sourcesRes] = await Promise.all([
        callApi('meta/tags', {}),
        callApi('meta/sources', {})
      ])
      
      this.setData({
        tags: tagsRes.list || [],
        sources: sourcesRes.list || [],
        loading: false
      })
    } catch (error) {
      console.error('加载元数据失败:', error)
      toast('加载失败，请重试')
      this.setData({ loading: false })
    }
  },

  // 标题输入
  onTitleChange(e) {
    this.setData({ title: e.detail.value })
  },

  // 描述输入
  onDescriptionChange(e) {
    this.setData({ description: e.detail.value })
  },

  // 标签点击
  onTagClick(e) {
    const tagId = e.currentTarget.dataset.id
    const { selectedTags } = this.data
    
    if (selectedTags.includes(tagId)) {
      this.setData({
        selectedTags: selectedTags.filter(id => id !== tagId)
      })
    } else {
      this.setData({
        selectedTags: [...selectedTags, tagId]
      })
    }
  },

  // 来源选择
  onSourceChange(e) {
    const sourceIndex = e.detail.value
    const sources = this.data.sources
    if (sources[sourceIndex]) {
      this.setData({ 
        selectedSource: sources[sourceIndex]._id,
        sourceIndex: sourceIndex
      })
    }
  },

  // 上传图片
  async onUploadImage() {
    try {
      const res = await new Promise((resolve, reject) => {
        wx.chooseImage({
          count: 5,
          sizeType: ['original', 'compressed'],
          sourceType: ['album', 'camera'],
          success: resolve,
          fail: reject
        })
      })

      // 这里可以添加图片上传逻辑
      // 目前先模拟本地存储
      const images = res.tempFilePaths
      this.setData({
        images: [...this.data.images, ...images].slice(0, 5)
      })
      
      toast(`已选择 ${images.length} 张图片`)
    } catch (error) {
      console.error('选择图片失败:', error)
    }
  },

  // 删除图片
  onRemoveImage(e) {
    const index = e.currentTarget.dataset.index
    const images = this.data.images.filter((_, i) => i !== index)
    this.setData({ images })
  },

  // 预览图片
  onPreviewImage(e) {
    const url = e.currentTarget.dataset.url
    wx.previewImage({
      current: url,
      urls: this.data.images
    })
  },

  // 验证表单
  validateForm() {
    const { title, description, selectedTags, selectedSource } = this.data
    
    if (!title.trim()) {
      toast('请输入标题')
      return false
    }
    
    if (title.trim().length < 3) {
      toast('标题至少需要 3 个字符')
      return false
    }
    
    if (!description.trim()) {
      toast('请输入描述')
      return false
    }
    
    if (description.trim().length < 10) {
      toast('描述至少需要 10 个字符')
      return false
    }
    
    if (selectedTags.length === 0) {
      toast('请选择至少一个标签')
      return false
    }
    
    if (!selectedSource) {
      toast('请选择来源')
      return false
    }
    
    return true
  },

  // 发布内容
  async onPublish() {
    if (!this.validateForm()) {
      return
    }

    try {
      this.setData({ publishing: true })
      wx.showLoading({ title: '发布中...' })

      const { title, description, selectedTags, selectedSource, images } = this.data
      
      const result = await callApi('content/publish', {
        title: title.trim(),
        description: description.trim(),
        tags: selectedTags,
        sourceId: selectedSource,
        images: images,
        publishedBy: getUserId()
      })

      wx.hideLoading()
      this.setData({ publishing: false })

      if (result.ok || result._id) {
        wx.showModal({
          title: '发布成功',
          content: '信息已成功发布到大厅',
          showCancel: false,
          success: () => {
            // 返回首页
            wx.switchTab({
              url: '/pages/home/index'
            })
          }
        })
      } else {
        toast('发布失败，请重试')
      }
    } catch (error) {
      console.error('发布失败:', error)
      wx.hideLoading()
      this.setData({ publishing: false })
      toast('发布失败，请检查网络')
    }
  },

  // 草稿保存（可选）
  saveDraft() {
    const { title, description, selectedTags, selectedSource } = this.data
    wx.setStorageSync('publishDraft', {
      title,
      description,
      selectedTags,
      selectedSource,
      savedAt: Date.now()
    })
    toast('已保存为草稿')
  },

  // 页面加载时恢复草稿（可选）
  restoreDraft() {
    try {
      const draft = wx.getStorageSync('publishDraft')
      if (draft && Date.now() - draft.savedAt < 24 * 60 * 60 * 1000) {
        wx.showModal({
          title: '恢复草稿',
          content: '发现上次的草稿，是否恢复？',
          success: (res) => {
            if (res.confirm) {
              const { title, description, selectedTags, selectedSource } = draft
              this.setData({ title, description, selectedTags, selectedSource })
            }
          }
        })
      }
    } catch (error) {
      console.error('恢复草稿失败:', error)
    }
  }
})
