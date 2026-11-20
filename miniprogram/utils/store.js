const seed = require('../data/matches.json')
const bundledConfig = require('../data/config.json')

function dedupe(rows) {
  const map = {}
  ;(rows || []).forEach((row) => {
    map[row.matchKey || row._id] = row
  })
  return Object.keys(map).map((key) => map[key])
}

function fetchPages(db, season, ordered, total) {
  const pageSize = 20
  const pages = Math.max(1, Math.ceil((total || 0) / pageSize))
  const tasks = []
  for (let index = 0; index < pages; index += 1) {
    let query = db.collection('matches').where({ season: season })
    if (ordered) query = query.orderBy('kickoffAt', 'asc')
    tasks.push(query.skip(index * pageSize).limit(pageSize).get())
  }
  return Promise.all(tasks).then((result) => {
    const rows = []
    result.forEach((page) => {
      ;(page.data || []).forEach((row) => rows.push(row))
    })
    return dedupe(rows)
  })
}

function fetchSeason(db, season) {
  const ordered = db.collection('matches').where({ season: season }).orderBy('kickoffAt', 'asc')
  return ordered.count().then((countResult) => {
    return fetchPages(db, season, true, countResult.total)
  }).catch(() => {
    return db.collection('matches').where({ season: season }).count().then((countResult) => {
      return fetchPages(db, season, false, countResult.total)
    })
  })
}

function loadConfig(db) {
  return db.collection('config').doc('app').get().then((result) => {
    return Object.assign({}, bundledConfig, result.data || {})
  }).catch(() => bundledConfig)
}

function loadSchedule() {
  const app = getApp()
  if (!app.globalData.cloudReady) {
    app.globalData.matches = seed
    app.globalData.config = bundledConfig
    return Promise.resolve({
      source: 'local',
      matches: seed,
      config: bundledConfig
    })
  }
  const db = wx.cloud.database()
  return Promise.all([fetchSeason(db, '2027'), loadConfig(db)]).then((result) => {
    app.globalData.matches = result[0]
    app.globalData.config = result[1]
    return {
      source: result[0].length ? 'cloud' : 'empty',
      matches: result[0],
      config: result[1]
    }
  }).catch((error) => {
    app.globalData.matches = []
    app.globalData.config = bundledConfig
    return {
      source: 'error',
      matches: [],
      config: bundledConfig,
      error
    }
  })
}

function findMatch(matchKey) {
  const app = getApp()
  const rows = app.globalData.matches || []
  for (let index = 0; index < rows.length; index += 1) {
    if (rows[index].matchKey === matchKey) return rows[index]
  }
  return null
}

function callAdmin(name, data) {
  return wx.cloud.callFunction({ name, data: data || {} }).then((result) => {
    const body = result.result || {}
    if (!body.ok) {
      const error = new Error(body.error || '没有写入')
      error.detail = body
      throw error
    }
    return body
  })
}

module.exports = {
  seed,
  bundledConfig,
  loadSchedule,
  findMatch,
  callAdmin
}
