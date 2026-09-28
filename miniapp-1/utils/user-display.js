const DEFAULT_DISPLAY_NAME = '用户'

function getDisplayName(user, fallback = DEFAULT_DISPLAY_NAME) {
  const candidates = [user?.displayName, user?.nickname, user?.userName, user?.username]
  const value = candidates.find(item => typeof item === 'string' && item.trim())
  return value ? value.trim().slice(0, 24) : fallback
}

function normalizeUser(user) {
  if (!user || typeof user !== 'object') return {}
  const displayName = getDisplayName(user)
  return { ...user, displayName, nickname: user.nickname || displayName }
}

function normalizeParticipant(item) {
  if (!item || typeof item !== 'object') return item
  const displayName = getDisplayName(item)
  return { ...item, displayName, userName: displayName, senderName: item.senderName || displayName }
}

module.exports = { DEFAULT_DISPLAY_NAME, getDisplayName, normalizeUser, normalizeParticipant }
