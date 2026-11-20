const COMPETITIONS = ['csl', 'fa_cup', 'super_cup', 'afc']
const STATUSES = ['scheduled', 'finished', 'postponed', 'canceled']
const KICKOFF_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/
const ALIASES = ['大连英博', '大连英博海发']
const TEAM = '大连英博'

function fail(message) {
  const error = new Error(message)
  error.expose = true
  throw error
}

function normalizeTeam(name) {
  const trimmed = String(name || '').trim()
  if (ALIASES.indexOf(trimmed) >= 0) return TEAM
  return trimmed
}

function kickoffYear(iso) {
  const date = new Date(iso)
  if (!iso || Number.isNaN(date.getTime())) return null
  const shifted = new Date(date.getTime() + 8 * 60 * 60 * 1000)
  return shifted.getUTCFullYear()
}

function matchKeyOf(match) {
  return [match.competition, match.season, match.round, match.home, match.away].join('|')
}

function baseFields(input) {
  const source = input || {}
  const competition = String(source.competition || '').trim()
  if (COMPETITIONS.indexOf(competition) < 0) fail('赛事代码不正确')
  if (String(source.season || '').trim() !== '2027') fail('赛季只能是 2027')
  const round = String(source.round || '').trim()
  const home = normalizeTeam(source.home)
  const away = normalizeTeam(source.away)
  const venue = String(source.venue || '').trim()
  const kickoffAt = String(source.kickoffAt || '').trim()
  if (!round) fail('请填写轮次')
  if (!home || !away) fail('请填写主队和客队')
  if (home === away) fail('主队和客队不能相同')
  if (!KICKOFF_PATTERN.test(kickoffAt) || kickoffYear(kickoffAt) === null) fail('开球时间无法识别')
  return { competition, season: '2027', round, home, away, venue, kickoffAt, year: kickoffYear(kickoffAt) }
}

function asPlaceholder(input) {
  const base = baseFields(input)
  if (base.year !== 2026) fail('占位记录的开球时间必须在 2026 年')
  const match = {
    competition: base.competition,
    season: '2027',
    placeholder: true,
    copiedFromSeason: '2026',
    round: base.round,
    home: base.home,
    away: base.away,
    kickoffAt: base.kickoffAt,
    venue: base.venue,
    status: 'finished'
  }
  match.matchKey = matchKeyOf(match)
  return match
}

function asOfficial(input) {
  const base = baseFields(input)
  const status = STATUSES.indexOf(input && input.status) >= 0 ? input.status : 'scheduled'
  const match = {
    competition: base.competition,
    season: '2027',
    placeholder: false,
    copiedFromSeason: '',
    round: base.round,
    home: base.home,
    away: base.away,
    kickoffAt: base.kickoffAt,
    venue: base.venue,
    status
  }
  match.matchKey = matchKeyOf(match)
  return match
}

async function assertAdmin(cloud, db) {
  const context = cloud.getWXContext()
  const openid = context && context.OPENID
  if (!openid) fail('没有维护权限')
  const found = await db.collection('admins').where({ openid }).limit(1).get()
  if (!found.data || !found.data.length) {
    fail(`没有维护权限。当前 openid：${openid}。请在云数据库 admins 新增一条 {"openid":"${openid}"}。`)
  }
}

async function findByKey(db, matchKey) {
  if (!matchKey) return null
  const found = await db.collection('matches').where({ matchKey }).limit(1).get()
  return found.data && found.data[0] ? found.data[0] : null
}

async function saveMatch(db, match, oldMatchKey) {
  const current = await findByKey(db, match.matchKey)
  const previous = oldMatchKey && oldMatchKey !== match.matchKey ? await findByKey(db, oldMatchKey) : null
  if (current && previous && current._id !== previous._id) fail('已经有另一场使用这个对阵和轮次')
  const target = current || previous
  const data = Object.assign({}, match, { updatedAt: db.serverDate() })
  if (target) {
    await db.collection('matches').doc(target._id).update({ data })
    return 'updated'
  }
  await db.collection('matches').add({ data })
  return 'created'
}

async function removeByKey(db, matchKey) {
  const found = await db.collection('matches').where({ matchKey }).limit(20).get()
  const rows = found.data || []
  for (let index = 0; index < rows.length; index += 1) {
    await db.collection('matches').doc(rows[index]._id).remove()
  }
  return rows.length
}

function caught(error) {
  return { ok: false, error: (error && error.message) || '写入失败' }
}

module.exports = {
  asPlaceholder,
  asOfficial,
  assertAdmin,
  findByKey,
  saveMatch,
  removeByKey,
  caught,
  kickoffYear,
  matchKeyOf
}
