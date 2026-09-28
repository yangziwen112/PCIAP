const EVIDENCE_ROUTES = new Set(['campus_info', 'upcoming', 'public_data', 'web_search'])

function uniqueCount(items) {
  return new Set(items.filter(Boolean).map(item => String(item).trim().toLowerCase())).size
}

function buildAudit(state = {}) {
  const route = String(state.intent?.route || '')
  const evidence = Array.isArray(state.evidence) ? state.evidence : []
  const links = Array.isArray(state.links) ? state.links : []
  const reviewApproved = state.review?.approved === true
  const review = state.review && Object.keys(state.review).length
    ? (reviewApproved ? 'approved' : 'fallback')
    : 'unknown'
  const degraded = (state.trace || []).some(item => item && item.status === 'safe_degrade') || review === 'fallback'
  const evidenceRequired = EVIDENCE_ROUTES.has(route)
  const sourceCount = uniqueCount(evidence.map(item => item?.sourceName || item?.sourceUrl || item?.id))
  const officialSourceCount = evidence.filter(item => item?.isOfficial === true).length
  const hasAccessibleSource = links.some(item => item?.type === 'web' && /^https:\/\//i.test(String(item.url || '')))
    || evidence.some(item => /^https:\/\//i.test(String(item.sourceUrl || '')))

  let status = 'not_required'
  let label = '无需外部核验'
  let action = '可以继续向我描述你的问题。'
  let degradation = ''
  if (evidenceRequired) {
    if (evidence.length === 0) {
      status = 'insufficient'
      label = '暂无可靠证据'
      action = '请打开官方入口核验，或稍后重新查询。'
      degradation = degraded ? '回答经过安全降级' : '当前未检索到可用来源'
    } else if (reviewApproved && sourceCount > 0 && hasAccessibleSource && !degraded) {
      status = 'verified'
      label = officialSourceCount > 0 ? '已核验官方来源' : '已核验可用来源'
      action = '关键时间和资格条件仍建议打开原文确认。'
    } else {
      status = 'partial'
      label = '部分核验'
      action = '请打开参考资料确认关键细节。'
      degradation = degraded ? '回答经过安全降级或审核未通过' : '来源链接或证据完整性不足'
    }
  }

  return {
    status,
    label,
    evidenceRequired,
    evidenceCount: evidence.length,
    sourceCount,
    officialSourceCount,
    referenceCount: links.length,
    review,
    degradation,
    action
  }
}

module.exports = { buildAudit }
