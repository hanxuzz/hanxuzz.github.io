const cloud = require('wx-server-sdk')
const guard = require('./guard')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  try {
    await guard.assertAdmin(cloud, db)
    const matchKey = String((event && event.matchKey) || '').trim()
    if (!matchKey) return { ok: false, error: '缺少 matchKey' }
    const removed = await guard.removeByKey(db, matchKey)
    return { ok: true, removed }
  } catch (error) {
    return guard.caught(error)
  }
}
