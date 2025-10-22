Component({
  properties: {
    item: { type: Object, value: {} }
  },
  methods: {
    onTap() {
      const id = this.data.item?._id
      if (id) wx.navigateTo({ url: `/pages/detail/index?id=${id}` })
    },
    onToggleFavorite(e) {
      e.stopPropagation?.()
      const id = e.currentTarget.dataset.id
      this.triggerEvent('favorite', { id })
    }
  }
}) 