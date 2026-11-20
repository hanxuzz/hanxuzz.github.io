const cloud = require('wx-server-sdk')
const guard = require('./guard')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  try {
    await guard.assertAdmin(cloud, db)
    const match = guard.asPlaceholder(event.match)
    const oldMatchKey = String((event && event.oldMatchKey) || match.matchKey)
    const previous = oldMatchKey === match.matchKey ? null : await guard.findByKey(db, oldMatchKey)
    const current = await guard.findByKey(db, match.matchKey)
    if ((previous && previous.placeholder === false) || (current && current.placeholder === false)) {
      return { ok: false, error: '这场已经是正式赛程，占位导入和占位修正不会改它。' }
    }
    const action = await guard.saveMatch(db, match, oldMatchKey)
    return { ok: true, action, matchKey: match.matchKey }
  } catch (error) {
    return guard.caught(error)
  }
}
