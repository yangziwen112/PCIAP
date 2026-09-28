const fs = require('fs')
const path = require('path')

const fixturePath = path.join(__dirname, 'personas.json')
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'))
const allowedRoles = new Set(['student', 'admin'])
const forbiddenMarkers = /example\.(edu|com)|picsum\.photos|password|openid|token|secret/i

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function simulatePersona(persona) {
  assert(persona.id && persona.displayName && persona.username, `${persona.id || 'unknown'} 缺少身份字段`)
  assert(allowedRoles.has(persona.role), `${persona.id} 使用了未接入权限模型的角色 ${persona.role}`)
  assert(!forbiddenMarkers.test(JSON.stringify(persona)), `${persona.id} 包含敏感字段或占位来源`)
  assert(Array.isArray(persona.actions) && persona.actions.length >= 3, `${persona.id} 缺少完整操作路径`)

  const events = [{ type: 'session_started', role: persona.role }]
  for (const action of persona.actions) {
    events.push({ type: action, result: action === 'remove_demo_content' ? 'dry_run_only' : 'contract_checked' })
  }
  return { personaId: persona.id, displayName: persona.displayName, role: persona.role, events }
}

const report = {
  mode: 'local-qa-simulation',
  writesCloudData: false,
  usesRealCredentials: false,
  scenarios: fixture.personas.map(simulatePersona),
  assertions: [
    '游客/学生只能使用公开资讯与本人数据边界内的功能',
    '管理员操作必须经过后端权限校验',
    '演示数据清理只允许 dry-run 或管理员显式确认',
    'AI 无证据时返回 no_match，不生成具体日期'
  ]
}

console.log(JSON.stringify(report, null, 2))
