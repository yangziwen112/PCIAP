const assert = require('assert')
const { createRepository } = require('../lib/services/repository')
const { publicDatabase } = require('../lib/tools')

function createFakeDb(rows, options = {}) {
  const calls = []
  const command = {
    in: values => ({ $in: values }),
    and: (...values) => ({ $and: values }),
    or: (...values) => ({ $or: values })
  }
  const collection = () => ({
    where(value) {
      calls.push(value)
      return this
    },
    orderBy() { return this },
    limit() { return this },
    async get() {
      if (options.fail) throw new Error('DB_UNAVAILABLE')
      return { data: rows }
    }
  })
  return {
    command,
    RegExp: value => ({ $regex: value }),
    collection,
    calls
  }
}

async function main() {
  const row = {
    _id: 'notice-1',
    status: 'published',
    category: 'notice',
    title: '校园服务通知',
    summary: '常规通知摘要',
    description: '研究生新生报到材料提交说明',
    actionItem: '请在系统中提交材料',
    sourceName: '研究生院官网',
    publishTime: Date.now(),
    ingestType: 'crawler'
  }

  const db = createFakeDb([row])
  const repository = createRepository(db)
  const records = await repository.searchContents('研究生报到材料', { category: 'notice' })
  assert.equal(records.length, 1)
  assert.equal(records[0].actionItem, '请在系统中提交材料')
  assert.ok(JSON.stringify(db.calls).includes('description'))

  const publicResult = await publicDatabase(createFakeDb([row]), '研究生报到材料', { keywords: ['报到'] })
  assert.equal(publicResult.status, 'grounded')
  assert.equal(publicResult.records[0].sourceName, '研究生院官网')
  assert.equal(publicResult.records[0].description, row.description)

  const unavailable = await publicDatabase(createFakeDb([], { fail: true }), '报到', { keywords: ['报到'] })
  assert.equal(unavailable.status, 'unavailable')
  assert.equal(unavailable.available, false)
  assert.equal(unavailable.records.length, 0)

  console.log('Knowledge base retrieval contract tests passed')
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
