const assert = require('assert')
const { getDisplayName, normalizeParticipant, normalizeUser } = require('../../../utils/user-display')

assert.equal(getDisplayName({ nickname: '昵称', username: '账号' }), '昵称')
assert.equal(getDisplayName({ displayName: '展示名', nickname: '昵称' }), '展示名')
assert.equal(getDisplayName({ username: '20260001' }), '20260001')
assert.equal(getDisplayName({}), '用户')
assert.deepEqual(normalizeUser({ userId: 'u1', username: '20260001' }), {
  userId: 'u1', username: '20260001', displayName: '20260001', nickname: '20260001'
})
assert.deepEqual(normalizeParticipant({ userId: 'u2', nickname: '同学' }), {
  userId: 'u2', nickname: '同学', displayName: '同学', userName: '同学', senderName: '同学'
})
console.log('User display contract tests passed')
