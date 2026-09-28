const assert = require('assert')
const { rankEvidence } = require('../lib/evidence-ranking')

const records = rankEvidence([
  { id: 'old', title: '校园生活安排', summary: '普通信息', publishTime: Date.now() - 86400000 * 60, isOfficial: false },
  { id: 'target', title: '研究生报到材料提交通知', description: '研究生新生报到材料提交说明', actionItem: '请在系统中提交材料', sourceName: '研究生院官网', sourceUrl: 'https://graduate.example.edu/notice', publishTime: Date.now(), isOfficial: true },
  { id: 'duplicate', title: '研究生报到材料提交通知', sourceName: '镜像来源', publishTime: Date.now() }
], '研究生报到材料', { keywords: ['研究生报到材料'] })

assert.equal(records[0].id, 'target')
assert.ok(records[0].retrievalScore > records[1].retrievalScore)
assert.ok(records[0].matchFields.includes('title'))
assert.equal(records.length, 3)
console.log('Evidence ranking tests passed')
