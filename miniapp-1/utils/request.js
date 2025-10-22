const app = getApp()

export function callApi(route, data = {}) {
  return app?.callApi ? app.callApi(route, data) : Promise.resolve({})
}

export function withLoading(promise, title = '加载中') {
  wx.showLoading({ title, mask: true })
  return promise.finally(() => wx.hideLoading())
}

export function toast(title, icon = 'none') {
  wx.showToast({ title, icon })
}

export function debounce(fn, delay = 300) {
  let timer = null
  return function(...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
} 