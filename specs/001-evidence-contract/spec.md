# Feature Specification: 证据合同驱动的校园 AI 回答

**Feature Branch**: `001-evidence-contract`
**Created**: 2026-09-27
**Status**: Draft
**Input**: 将 PCIAP 从“能聊天”提升为“每条回答都能解释可信度和来源状态”的校园信息产品。

## User Scenarios & Testing

### User Story 1 - 看到回答可信度 (Priority: P1)

学生提问通知、考试或报名事项后，回答下方能直接看到“已核验 / 部分核验 / 暂无可靠证据”等状态，以及来源数量和下一步动作。

**Why this priority**: 校园信息的核心风险不是没有回答，而是用户把未经核验的回答当成官方结论。

**Independent Test**: 使用有官方来源、无来源和仅有缓存三类输入，分别获得可区分的证据状态，不改变回答正文。

**Acceptance Scenarios**:

1. **Given** 回答有至少一个有效官方内容来源，**When** 展示回答，**Then** 显示“已核验”或等价状态、来源数量和原文入口。
2. **Given** 检索没有可靠来源，**When** 展示回答，**Then** 显示“暂无可靠证据”，不显示确定性日期，并提示用户核验原文。
3. **Given** 回答来自缓存或备用数据，**When** 展示回答，**Then** 明确显示“备用来源/缓存”而不是“实时”。

### User Story 2 - 保留可追踪审计信息 (Priority: P1)

管理员或调试人员可以通过已有的运行记录区分意图、证据、审核、降级和耗时，但普通用户看不到内部 token、数据库字段或工作流实现细节。

**Independent Test**: 检查成功、降级、审核拒绝三条路径返回的 `meta.audit` 结构完整且不含密钥、原始图片或内部提示词。

### User Story 3 - 统一失败表达 (Priority: P2)

当模型、搜索或数据库不可用时，用户看到的是可理解的“暂不可核验”状态和可执行下一步，而不是“工作流失败”等内部错误。

**Independent Test**: 模拟工具异常和审核失败，回答仍能返回稳定的证据状态和降级说明。

## Edge Cases

- 有来源但没有可访问原文链接时，状态不能高于“部分核验”。
- 来源时间缺失或明显过期时，显示时间未知/需复核，不生成新日期。
- 社交闲聊、平台帮助等不需要外部证据的路由，不显示“暂无证据”警告。
- 历史消息没有 `audit` 字段时，前端保持兼容，不渲染空卡片。

## Requirements

### Functional Requirements

- **FR-001**: 系统 MUST 为每次 AI 回答生成机器可读的 `meta.audit`。
- **FR-002**: `meta.audit` MUST 区分 `verified`、`partial`、`insufficient` 和 `not_required` 四种证据状态。
- **FR-003**: `meta.audit` MUST 包含证据数量、有效来源数量、回答是否经过审核和降级原因。
- **FR-004**: 系统 MUST 不把缓存、估值或无链接来源标记为已核验官方来源。
- **FR-005**: 小程序 MUST 用简短中文状态展示审计结果，并保留原有引用展开入口。
- **FR-006**: 审计结果 MUST 不包含 API Key、内部 token、原始图片 URL、完整用户标识或提示词。
- **FR-007**: 现有历史消息、非 AI 消息和已有链接展示 MUST 保持兼容。

## Success Criteria

- **SC-001**: 有来源、无来源、缓存/备用来源三类测试均能得到稳定且不同的证据状态。
- **SC-002**: RAG 工作流测试覆盖 `meta.audit` 的结构、降级原因和隐私字段排除。
- **SC-003**: 普通用户在回答区域一次操作内能判断“是否需要打开原文核验”。
- **SC-004**: 原有 RAG、采集器和 JavaScript 语法检查不回归。

## Assumptions

- 现有 `evidence`、`links`、`review` 和 `toolResults` 是审计所需的最小事实来源。
- 本次不更换模型、不新增外部搜索服务、不重写现有页面信息架构。
- 审计状态是产品解释层，不构成学校官方认证或法律意义上的证明。
