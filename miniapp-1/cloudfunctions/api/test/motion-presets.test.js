const assert = require('assert')
const { buildAnimationPlan, getMotionPreset } = require('../../../utils/motion-presets')

assert.equal(getMotionPreset('pageEnter').duration, 220)
assert.equal(buildAnimationPlan('cardPress', { reducedMotion: true }).duration, 0)
assert.deepEqual(buildAnimationPlan('feedback', { duration: 300 }).duration, 300)
assert.deepEqual(buildAnimationPlan('unknown', { reducedMotion: true }).scale, [1, 1])
console.log('Motion preset contract tests passed')
