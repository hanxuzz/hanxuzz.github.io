const cloud = require('wx-server-sdk')
const guard = require('./guard')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  try {
    await guard.assertAdmin(cloud, db)
    const rows = event && event.matches
    if (!Array.isArray(rows) || !rows.length) return { ok: false, error: '没有可导入的场次' }
    if (rows.length > 80) return { ok: false, error: '一次导入的场次太多' }
    const prepared = rows.map((row) => guard.asPlaceholder(row))
    const keys = prepared.map((row) => row.matchKey)
    if (new Set(keys).size !== keys.length) return { ok: false, error: '种子里有重复场次' }
    let created = 0
    let updated = 0
    let skipped = 0
    for (let index = 0; index < prepared.length; index += 1) {
      const match = prepared[index]
      const existing = await guard.findByKey(db, match.matchKey)
      if (existing && existing.placeholder === false) {
        skipped += 1
        continue
      }
      const action = await guard.saveMatch(db, match, match.matchKey)
      if (action === 'created') created += 1
      else updated += 1
    }
    return { ok: true, created, updated, skipped }
  } catch (error) {
    return guard.caught(error)
  }
}
