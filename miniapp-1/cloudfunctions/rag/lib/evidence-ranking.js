function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase()
}

function defaultKeywords(query) {
  const text = normalizeText(query)
  return [...new Set(text.split(/[\s,，。？！?、:：；;()（）「」【】]+/).filter(item => item.length >= 2))].slice(0, 8)
}

function fieldText(item, field) {
  if (field === 'tags') return Array.isArray(item?.tags) ? item.tags.join(' ') : ''
  return item?.[field] || ''
}

function scoreEvidence(item, keywords = [], now = Date.now()) {
  const fields = [
    ['title', 10],
    ['actionItem', 7],
    ['summary', 5],
    ['description', 4],
    ['tags', 3],
    ['sourceName', 2]
  ]
  const normalizedKeywords = keywords.map(normalizeText).filter(Boolean)
  const matchFields = []
  let score = Number(item?.evidenceScore || 0)

  for (const [field, weight] of fields) {
    const text = normalizeText(fieldText(item, field))
    if (!text) continue
    const matched = normalizedKeywords.filter(keyword => text.includes(keyword))
    if (matched.length) {
      score += weight * Math.min(matched.length, 2)
      matchFields.push(field)
    }
  }

  const queryPhrase = normalizeText(keywords[0])
  if (queryPhrase && normalizeText(item?.title).includes(queryPhrase)) score += 8
  if (item?.isOfficial === true) score += 4
  if (/^https:\/\//i.test(String(item?.sourceUrl || ''))) score += 2

  const publishTime = Number(item?.publishTime || 0)
  if (publishTime > 0) {
    const ageDays = Math.max(0, (now - publishTime) / 86400000)
    score += Math.max(0, 5 - Math.min(ageDays / 14, 5))
  }

  return {
    ...item,
    retrievalScore: Math.round(score * 100) / 100,
    retrievalConfidence: Math.min(0.99, Math.max(0, Math.round((score / 55) * 100) / 100)),
    matchFields
  }
}

function rankEvidence(items, query = '', options = {}) {
  const keywords = Array.isArray(options.keywords) && options.keywords.length
    ? options.keywords
    : defaultKeywords(query)
  const now = Number(options.now || Date.now())
  const seen = new Set()
  return (Array.isArray(items) ? items : [])
    .filter(item => item && typeof item === 'object')
    .filter(item => {
      const key = String(item.id || item._id || item.sourceUrl || item.title || '').trim().toLowerCase()
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map(item => scoreEvidence(item, keywords, now))
    .sort((a, b) => (b.retrievalScore - a.retrievalScore)
      || (Number(b.publishTime || 0) - Number(a.publishTime || 0)))
}

module.exports = { normalizeText, defaultKeywords, scoreEvidence, rankEvidence }
