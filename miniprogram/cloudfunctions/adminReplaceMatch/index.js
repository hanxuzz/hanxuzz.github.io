const cloud = require('wx-server-sdk')
const guard = require('./guard')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  try {
    await guard.assertAdmin(cloud, db)
    const match = guard.asOfficial(event.match)
    const oldMatchKey = String((event && event.oldMatchKey) || '')
    const action = await guard.saveMatch(db, match, oldMatchKey)
    return { ok: true, action, matchKey: match.matchKey, placeholder: false }
  } catch (error) {
    return guard.caught(error)
  }
}
