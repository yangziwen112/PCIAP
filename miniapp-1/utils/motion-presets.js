// Platform-neutral motion contract inspired by Motion variants and GSAP timelines.
// The mini-program consumes the returned plan through wx.createAnimation/WXSS;
// no DOM or browser-only runtime is imported here.

const MOTION_PRESETS = Object.freeze({
  pageEnter: Object.freeze({ duration: 220, timingFunction: 'ease-out', opacity: [0, 1], translateY: [12, 0] }),
  cardPress: Object.freeze({ duration: 120, timingFunction: 'ease-out', scale: [1, 0.98] }),
  feedback: Object.freeze({ duration: 180, timingFunction: 'ease-out', opacity: [0, 1], translateY: [6, 0] })
})

function getMotionPreset(name, overrides = {}) {
  const preset = MOTION_PRESETS[name] || MOTION_PRESETS.feedback
  return { ...preset, ...overrides }
}

function buildAnimationPlan(name, options = {}) {
  const { reducedMotion = false, ...overrides } = options
  const preset = getMotionPreset(name, overrides)
  if (reducedMotion) return { ...preset, duration: 0, opacity: [1, 1], translateY: [0, 0], scale: [1, 1] }
  return preset
}

module.exports = { MOTION_PRESETS, getMotionPreset, buildAnimationPlan }
