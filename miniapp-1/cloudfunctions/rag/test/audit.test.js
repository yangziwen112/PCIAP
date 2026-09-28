const assert = require('assert')
const { buildAudit } = require('../lib/audit')

function state(overrides = {}) {
  return {
    intent: { route: 'upcoming' },
    evidence: [{ id: 'notice-1', title: '官方通知', sourceName: '学校官网', sourceUrl: 'https://example.edu/notice', isOfficial: true }],
    links: [{ type: 'content', id: 'notice-1', title: '官方通知', sourceUrl: 'https://example.edu/notice' }],
    review: { approved: true },
    trace: [],
    ...overrides
  }
}

assert.equal(buildAudit(state()).status, 'verified')
assert.equal(buildAudit(state()).officialSourceCount, 1)
assert.equal(buildAudit(state({ evidence: [], links: [], review: {} })).status, 'insufficient')
assert.equal(buildAudit(state({
  links: [],
  evidence: [{ id: 'notice-1', title: '官方通知', sourceName: '学校官网', sourceUrl: '', isOfficial: true }]
})).status, 'partial')
assert.equal(buildAudit(state({ trace: [{ status: 'safe_degrade' }], review: { approved: false } })).status, 'partial')
assert.equal(buildAudit({ intent: { route: 'social_chat' }, evidence: [], links: [] }).status, 'not_required')

const audit = buildAudit(state())
assert.equal(typeof audit.label, 'string')
assert.equal(Object.prototype.hasOwnProperty.call(audit, 'sourceUrl'), false)
assert.equal(Object.prototype.hasOwnProperty.call(audit, 'token'), false)
console.log('Evidence audit tests passed')
