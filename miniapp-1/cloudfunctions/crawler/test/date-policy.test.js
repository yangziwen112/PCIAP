const assert = require('assert')
const {
  isRecentOrActive,
  calculateFreshnessScore
} = require('../lib/date-policy')

const now = Date.UTC(2026, 8, 28)
const day = 24 * 60 * 60 * 1000

assert.equal(isRecentOrActive(now - 10 * day, { registrationStartTime: now + day }, 7, now), true)
assert.equal(isRecentOrActive(now - 10 * day, { deadline: now - day }, 7, now), false)
assert.equal(isRecentOrActive(now - 2 * day, {}, 7, now), true)
assert.equal(calculateFreshnessScore(now - 15 * day, 30, now), 0.5)
console.log('date policy tests passed')
