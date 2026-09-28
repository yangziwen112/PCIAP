# Tasks: 证据合同驱动的校园 AI 回答

## Phase 1: Setup

- [x] T001 [P] 编写审计合同测试 `miniapp-1/cloudfunctions/rag/test/audit.test.js`
- [x] T002 [P] 盘点聊天页现有消息兼容字段 `miniapp-1/pages/chat/index.js`

## Phase 2: Foundational

- [x] T003 实现纯函数审计模块 `miniapp-1/cloudfunctions/rag/lib/audit.js`
- [x] T004 将审计合同接入 `miniapp-1/cloudfunctions/rag/lib/workflow.js`
- [x] T005 [P] 补充工具失败、无来源和备用来源测试

## Phase 3: User Story 1 - 可信度展示 (P1)

- [x] T006 [US1] 复用聊天页现有 `meta` 传递链，将审计结果安全展示
- [x] T007 [US1] 在 `miniapp-1/pages/chat/index.wxml` 增加证据状态卡并保留引用展开
- [x] T008 [US1] 在 `miniapp-1/pages/chat/index.wxss` 完成已核验/部分/不足三类视觉状态

## Phase 4: User Story 2 - 审计可追踪 (P1)

- [x] T009 [US2] 检查 API 现有 meta 持久化链路可保留 audit
- [x] T010 [US2] 保持历史消息缺少 audit 时不渲染空状态卡

## Phase 5: User Story 3 - 失败表达 (P2)

- [x] T011 [US3] 为降级状态补充用户可读 action 和 degradation 文案
- [x] T012 [US3] 运行 RAG 测试、采集器测试和页面 JavaScript 语法检查

## Phase 6: Polish

- [x] T013 [P] 更新 `docs/PROJECT_METADATA.md` 记录证据合同
- [x] T014 [P] 生成收敛报告并记录未覆盖的真实云端验证边界
