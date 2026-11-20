const matchUtil = require('../../utils/match')
const store = require('../../utils/store')

const SOURCE_LABEL = {
  local: '尚未绑定云环境，现在显示的是本地底稿。',
  cloud: '来自云数据库。',
  empty: '云数据库里还没有场次。',
  error: '云数据库暂时读不到，请下拉重试。'
}

Page({
  data: {
    filters: matchUtil.filtersFrom(matchUtil.DEFAULT_CONFIG),
    filter: 'all',
    notice: '2027 赛程未公布。',
    sourceLabel: '',
    groups: [],
    emptyNote: ''
  },

  onShow() {
    this.reload()
  },

  onPullDownRefresh() {
    this.reload().then(() => wx.stopPullDownRefresh())
  },

  reload() {
    return store.loadSchedule().then((loaded) => {
      this.loaded = loaded
      this.render()
    })
  },

  render() {
    const loaded = this.loaded || { matches: [], config: matchUtil.DEFAULT_CONFIG, source: 'empty' }
    const filter = this.data.filter
    const rows = loaded.matches.filter((match) => filter === 'all' || match.competition === filter)
    const groups = matchUtil.groupByMonth(rows, loaded.config)
    this.setData({
      filters: matchUtil.filtersFrom(loaded.config),
      notice: matchUtil.noticeFor(loaded.matches, loaded.config),
      sourceLabel: SOURCE_LABEL[loaded.source] || '',
      groups,
      emptyNote: groups.length ? '' : matchUtil.emptyCopy(filter)
    })
  },

  onFilter(event) {
    this.setData({ filter: event.currentTarget.dataset.id })
    this.render()
  },

  openDetail(event) {
    const key = event.currentTarget.dataset.key
    wx.navigateTo({ url: `/pages/detail/detail?key=${encodeURIComponent(key)}` })
  },

  openAdmin() {
    wx.navigateTo({ url: '/pages/admin/admin' })
  }
})
