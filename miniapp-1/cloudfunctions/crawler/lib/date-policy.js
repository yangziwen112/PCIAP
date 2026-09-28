const DAY_MS = 24 * 60 * 60 * 1000

function asTimestamp(value) {
  const timestamp = Number(value || 0)
  return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : 0
}

function isRecentOrActive(publishTime, schedule = {}, recencyDays = 7, now = Date.now()) {
  const currentTime = asTimestamp(now) || Date.now()
  const publishedAt = asTimestamp(publishTime)
  const windowDays = Math.max(1, Number(recencyDays) || 1)
  const recent = publishedAt > 0 && currentTime - publishedAt <= windowDays * DAY_MS
  const active = [
    schedule.registrationStartTime,
    schedule.deadline,
    schedule.startTime,
    schedule.endTime
  ].some(value => asTimestamp(value) > currentTime)
  return recent || active
}

function calculateFreshnessScore(publishTime, recencyDays = 30, now = Date.now()) {
  const publishedAt = asTimestamp(publishTime)
  if (!publishedAt) return 0.2
  const ageDays = Math.max(0, asTimestamp(now) - publishedAt) / DAY_MS
  const windowDays = Math.max(1, Number(recencyDays) || 30)
  return Math.max(0, Math.min(1, 1 - ageDays / windowDays))
}

module.exports = { asTimestamp, isRecentOrActive, calculateFreshnessScore }
