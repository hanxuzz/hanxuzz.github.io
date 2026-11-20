const matchUtil = require('../../utils/match')
const store = require('../../utils/store')

const STATUS_ORDER = matchUtil.STATUSES

Page({
  data: {
    oldMatchKey: '',
    competitionIndex: 0,
    competitionNames: matchUtil.COMPETITIONS.map((id) => matchUtil.competitionName(id)),
    round: '',
    home: '',
    away: '',
    date: '',
    time: '',
    venue: '',
    statusIndex: 0,
    statusNames: STATUS_ORDER.map((status) => matchUtil.STATUS_LABEL[status])
  },

  onLoad(options) {
    const key = decodeURIComponent(options.key || '')
    const raw = key ? store.findMatch(key) : null
    if (!raw) return
    const kickoff = matchUtil.splitKickoff(raw.kickoffAt)
    const competitionIndex = Math.max(0, matchUtil.COMPETITIONS.indexOf(raw.competition))
    const statusIndex = Math.max(0, STATUS_ORDER.indexOf(raw.status))
    this.setData({
      oldMatchKey: raw.matchKey,
      competitionIndex,
      round: raw.round || '',
      home: raw.home || '',
      away: raw.away || '',
      date: kickoff.date,
      time: kickoff.time,
      venue: raw.venue || '',
      statusIndex: raw.placeholder ? 0 : statusIndex
    })
  },

  onCompetition(event) {
    this.setData({ competitionIndex: Number(event.detail.value) })
  },

  onStatus(event) {
    this.setData({ statusIndex: Number(event.detail.value) })
  },

  onDate(event) {
    this.setData({ date: event.detail.value })
  },

  onTime(event) {
    this.setData({ time: event.detail.value })
  },

  onInput(event) {
    const field = event.currentTarget.dataset.field
    const patch = {}
    patch[field] = event.detail.value
    this.setData(patch)
  },

  form() {
    return {
      competition: matchUtil.COMPETITIONS[this.data.competitionIndex],
      round: this.data.round,
      home: this.data.home,
      away: this.data.away,
      date: this.data.date,
      time: this.data.time,
      venue: this.data.venue,
      status: STATUS_ORDER[this.data.statusIndex]
    }
  },

  ensureCloud() {
    if (getApp().globalData.cloudReady) return true
    wx.showModal({
      title: '还不能写',
      content: '先在 app.js 填写云环境 ID，并上传这四个云函数。',
      showCancel: false
    })
    return false
  },

  savePlaceholder() {
    if (!this.ensureCloud()) return
    const form = this.form()
    const problem = matchUtil.validatePlaceholder(form)
    if (problem) {
      wx.showModal({ title: '不能保存占位', content: problem, showCancel: false })
      return
    }
    const match = matchUtil.readForm(form)
    wx.showLoading({ title: '保存中' })
    store.callAdmin('adminUpsertMatch', { match, oldMatchKey: this.data.oldMatchKey }).then((body) => {
      wx.hideLoading()
      this.setData({ oldMatchKey: body.matchKey })
      wx.navigateBack()
    }).catch((error) => {
      wx.hideLoading()
      wx.showModal({ title: '没有保存', content: error.message, showCancel: false })
    })
  },

  replaceOfficial() {
    if (!this.ensureCloud()) return
    const form = this.form()
    const problem = matchUtil.validateOfficial(form)
    if (problem) {
      wx.showModal({ title: '不能替换', content: problem, showCancel: false })
      return
    }
    wx.showModal({
      title: '换成正式赛程',
      content: '会去掉「自 2026 复制」。开球时间用你刚填的，不会自动把年份改成 2027。',
      success: (result) => {
        if (!result.confirm) return
        const match = matchUtil.readForm(form)
        wx.showLoading({ title: '保存中' })
        store.callAdmin('adminReplaceMatch', { match, oldMatchKey: this.data.oldMatchKey }).then(() => {
          wx.hideLoading()
          wx.navigateBack()
        }).catch((error) => {
          wx.hideLoading()
          wx.showModal({ title: '没有替换', content: error.message, showCancel: false })
        })
      }
    })
  },

  removeMatch() {
    if (!this.ensureCloud()) return
    wx.showModal({
      title: '删除这场',
      content: '删除后需要再手工加回来。',
      success: (result) => {
        if (!result.confirm) return
        store.callAdmin('adminRemoveMatch', { matchKey: this.data.oldMatchKey }).then(() => {
          wx.navigateBack()
        }).catch((error) => {
          wx.showModal({ title: '没有删除', content: error.message, showCancel: false })
        })
      }
    })
  }
})
