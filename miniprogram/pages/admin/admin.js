const matchUtil = require('../../utils/match')
const store = require('../../utils/store')

Page({
  data: {
    cloudReady: false,
    cloudLabel: '',
    filters: matchUtil.filtersFrom(matchUtil.DEFAULT_CONFIG),
    filter: 'all',
    rows: []
  },

  onShow() {
    const app = getApp()
    this.setData({
      cloudReady: app.globalData.cloudReady,
      cloudLabel: app.globalData.cloudReady
        ? '已填写云环境。导入和修改会交给云函数。'
        : '还没有填写云环境 ID。赛程页可以看本地底稿，写入要等环境绑好。'
    })
    this.reload()
  },

  reload() {
    return store.loadSchedule().then((loaded) => {
      this.loaded = loaded
      this.render()
    })
  },

  render() {
    const loaded = this.loaded || { matches: [], config: matchUtil.DEFAULT_CONFIG }
    const filter = this.data.filter
    const rows = matchUtil.sortByKickoff(loaded.matches)
      .filter((match) => filter === 'all' || match.competition === filter)
      .map((match) => matchUtil.decorateMatch(match, loaded.config))
    this.setData({
      filters: matchUtil.filtersFrom(loaded.config),
      rows
    })
  },

  onFilter(event) {
    this.setData({ filter: event.currentTarget.dataset.id })
    this.render()
  },

  importSeed() {
    wx.showModal({
      title: '导入占位底稿',
      content: '按 matchKey 写入。已经换成正式赛程的场次会跳过，不会把同一场再导入一遍。',
      success: (result) => {
        if (!result.confirm) return
        wx.showLoading({ title: '导入中' })
        store.callAdmin('adminImportSeason', { matches: store.seed }).then((body) => {
          wx.hideLoading()
          wx.showToast({ title: `新增 ${body.created}，更新 ${body.updated}`, icon: 'none' })
          this.reload()
        }).catch((error) => {
          wx.hideLoading()
          wx.showModal({ title: '没有导入', content: error.message, showCancel: false })
        })
      }
    })
  },

  removePlaceholders() {
    if (this.data.filter === 'all') {
      wx.showToast({ title: '先选一项赛事', icon: 'none' })
      return
    }
    const rows = this.data.rows.filter((row) => row.placeholder)
    if (!rows.length) {
      wx.showToast({ title: '没有占位可删', icon: 'none' })
      return
    }
    const filterName = (this.data.filters.find((item) => item.id === this.data.filter) || {}).name || '这项'
    wx.showModal({
      title: '删除占位',
      content: `删除${filterName}里的 ${rows.length} 条占位。正式赛程不动。`,
      success: (result) => {
        if (!result.confirm) return
        wx.showLoading({ title: '删除中' })
        const run = rows.reduce((chain, row) => {
          return chain.then(() => store.callAdmin('adminRemoveMatch', { matchKey: row.matchKey }))
        }, Promise.resolve())
        run.then(() => {
          wx.hideLoading()
          this.reload()
        }).catch((error) => {
          wx.hideLoading()
          wx.showModal({ title: '没有删完', content: error.message, showCancel: false })
          this.reload()
        })
      }
    })
  },

  createMatch() {
    wx.navigateTo({ url: '/pages/edit/edit' })
  },

  editMatch(event) {
    const key = event.currentTarget.dataset.key
    wx.navigateTo({ url: `/pages/edit/edit?key=${encodeURIComponent(key)}` })
  }
})
