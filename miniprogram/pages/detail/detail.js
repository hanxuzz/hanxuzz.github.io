const matchUtil = require('../../utils/match')
const store = require('../../utils/store')

Page({
  data: {
    match: null
  },

  onLoad(options) {
    const key = decodeURIComponent(options.key || '')
    const apply = (loaded) => {
      const raw = (loaded.matches || []).find((item) => item.matchKey === key) || store.findMatch(key)
      this.setData({
        match: raw ? matchUtil.decorateMatch(raw, loaded.config || matchUtil.DEFAULT_CONFIG) : null
      })
    }
    const cached = store.findMatch(key)
    if (cached) {
      const app = getApp()
      apply({ matches: app.globalData.matches || [], config: app.globalData.config })
      return
    }
    store.loadSchedule().then(apply)
  }
})
