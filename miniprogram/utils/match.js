const DEFAULT_CONFIG = {
  defaultSeason: '2027',
  teamName: '大连英博',
  teamAliases: ['大连英博', '大连英博海发'],
  competitions: {
    csl: '中超',
    fa_cup: '足协杯',
    super_cup: '超级杯',
    afc: '亚冠'
  },
  placeholderNotice: '2027 赛程未公布，下列场次复制自 2026，开球时间未改。'
}

const COMPETITIONS = ['csl', 'fa_cup', 'super_cup', 'afc']
const STATUSES = ['scheduled', 'finished', 'postponed', 'canceled']
const KICKOFF_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/
const DETAIL_PLACEHOLDER = '本场开球时间复制自 2026，尚未换成 2027 赛程。'
const EMPTY_UNCOPYABLE = '2026 年没有大连英博的这场赛事可复制，2027 赛程公布前这里为空。'

const STATUS_LABEL = {
  scheduled: '未开赛',
  finished: '已结束',
  postponed: '延期',
  canceled: '取消'
}

function competitionName(code, config) {
  const names = (config && config.competitions) || DEFAULT_CONFIG.competitions
  return names[code] || code
}

function filtersFrom(config) {
  return [{ id: 'all', name: '全部' }].concat(COMPETITIONS.map((id) => ({
    id,
    name: competitionName(id, config)
  })))
}

function normalizeTeam(name, config) {
  const aliases = (config && config.teamAliases) || DEFAULT_CONFIG.teamAliases
  const canonical = (config && config.teamName) || DEFAULT_CONFIG.teamName
  const trimmed = String(name || '').trim()
  if (aliases.indexOf(trimmed) >= 0) return canonical
  return trimmed
}

function shanghaiParts(iso) {
  const date = new Date(iso)
  if (!iso || Number.isNaN(date.getTime())) return null
  const shifted = new Date(date.getTime() + 8 * 60 * 60 * 1000)
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const year = shifted.getUTCFullYear()
  const month = shifted.getUTCMonth() + 1
  const day = shifted.getUTCDate()
  const hours = String(shifted.getUTCHours()).padStart(2, '0')
  const minutes = String(shifted.getUTCMinutes()).padStart(2, '0')
  return {
    year,
    month,
    day,
    weekday: weekdays[shifted.getUTCDay()],
    dateKey: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    time: `${hours}:${minutes}`,
    monthLabel: `${year}年${month}月`,
    label: `${year}年${month}月${day}日 ${weekdays[shifted.getUTCDay()]} ${hours}:${minutes}`
  }
}

function kickoffYear(iso) {
  const parts = shanghaiParts(iso)
  return parts ? parts.year : null
}

function matchKeyOf(match) {
  return [match.competition, match.season, match.round, match.home, match.away].join('|')
}

function decorateMatch(match, config) {
  const parts = shanghaiParts(match.kickoffAt)
  const placeholder = match.placeholder === true
  const teamName = (config && config.teamName) || DEFAULT_CONFIG.teamName
  return {
    matchKey: match.matchKey,
    competition: match.competition,
    competitionName: competitionName(match.competition, config),
    season: match.season,
    round: match.round,
    home: match.home,
    away: match.away,
    homeOurs: match.home === teamName,
    awayOurs: match.away === teamName,
    kickoffAt: match.kickoffAt,
    kickoffLabel: parts ? parts.label : String(match.kickoffAt || ''),
    monthLabel: parts ? parts.monthLabel : '日期未知',
    venue: match.venue || '',
    venueLabel: match.venue ? match.venue : '场地待定',
    status: match.status,
    statusLabel: STATUS_LABEL[match.status] || match.status || '',
    placeholder,
    copiedFromSeason: match.copiedFromSeason || '',
    badge: placeholder ? '自 2026 复制' : '',
    detailNote: placeholder ? DETAIL_PLACEHOLDER : ''
  }
}

function sortByKickoff(matches) {
  return (matches || []).slice().sort((a, b) => String(a.kickoffAt).localeCompare(String(b.kickoffAt)))
}

function groupByMonth(matches, config) {
  const groups = []
  sortByKickoff(matches).forEach((match) => {
    const row = decorateMatch(match, config)
    const last = groups[groups.length - 1]
    if (!last || last.label !== row.monthLabel) {
      groups.push({ label: row.monthLabel, matches: [row] })
    } else {
      last.matches.push(row)
    }
  })
  return groups
}

function noticeFor(matches, config) {
  if (!matches || !matches.length) return '2027 赛程未公布。'
  if (matches.some((match) => match.placeholder === true)) {
    return (config && config.placeholderNotice) || DEFAULT_CONFIG.placeholderNotice
  }
  return ''
}

function emptyCopy(filterId) {
  if (filterId === 'super_cup' || filterId === 'afc') return EMPTY_UNCOPYABLE
  if (filterId === 'all') return '2027 赛程未公布，这里还没有场次。'
  return '这一项还没有场次。'
}

function joinKickoff(date, time) {
  if (!date || !time) return ''
  return `${date}T${time}:00+08:00`
}

function splitKickoff(iso) {
  const parts = shanghaiParts(iso)
  if (!parts) return { date: '', time: '' }
  return { date: parts.dateKey, time: parts.time }
}

function readForm(form, config) {
  const kickoffAt = joinKickoff(form.date, form.time)
  return {
    competition: form.competition,
    season: '2027',
    round: String(form.round || '').trim(),
    home: normalizeTeam(form.home, config),
    away: normalizeTeam(form.away, config),
    kickoffAt,
    venue: String(form.venue || '').trim(),
    status: form.status || 'scheduled'
  }
}

function validatePlaceholder(form, config) {
  const match = readForm(form, config)
  if (COMPETITIONS.indexOf(match.competition) < 0) return '请选择赛事'
  if (!match.round) return '请填写轮次'
  if (!match.home || !match.away) return '请填写主队和客队'
  if (match.home === match.away) return '主队和客队不能相同'
  if (!KICKOFF_PATTERN.test(match.kickoffAt) || kickoffYear(match.kickoffAt) === null) return '开球时间无法识别'
  if (kickoffYear(match.kickoffAt) !== 2026) return '占位记录的开球时间必须留在 2026 年，不能改成 2027。'
  return ''
}

function validateOfficial(form, config) {
  const match = readForm(form, config)
  if (COMPETITIONS.indexOf(match.competition) < 0) return '请选择赛事'
  if (!match.round) return '请填写轮次'
  if (!match.home || !match.away) return '请填写主队和客队'
  if (match.home === match.away) return '主队和客队不能相同'
  if (!KICKOFF_PATTERN.test(match.kickoffAt) || kickoffYear(match.kickoffAt) === null) return '开球时间无法识别'
  if (STATUSES.indexOf(match.status) < 0) return '状态不正确'
  return ''
}

module.exports = {
  DEFAULT_CONFIG,
  COMPETITIONS,
  STATUSES,
  STATUS_LABEL,
  KICKOFF_PATTERN,
  DETAIL_PLACEHOLDER,
  EMPTY_UNCOPYABLE,
  competitionName,
  filtersFrom,
  normalizeTeam,
  shanghaiParts,
  kickoffYear,
  matchKeyOf,
  decorateMatch,
  sortByKickoff,
  groupByMonth,
  noticeFor,
  emptyCopy,
  joinKickoff,
  splitKickoff,
  readForm,
  validatePlaceholder,
  validateOfficial
}
