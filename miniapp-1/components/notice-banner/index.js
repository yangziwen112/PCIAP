Component({
  properties: {
    items: { type: Array, value: [] }
  },
  methods: {
    onTap(e) {
      const link = e.currentTarget.dataset.link
      if (!link) return
      if (link.startsWith('http')) {
        wx.setClipboardData({ data: link, success: () => wx.showToast({ title: '链接已复制，请在浏览器打开', icon: 'none' }) })
      } else {
        wx.navigateTo({ url: link })
      }
    }
  }
}) 