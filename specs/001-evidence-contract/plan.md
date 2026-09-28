# Implementation Plan: 证据合同驱动的校园 AI 回答

**Branch**: `001-evidence-contract` | **Date**: 2026-09-27 | **Spec**: `spec.md`

## Summary

在 RAG 工作流出口增加纯函数审计层，将证据、来源、审核、降级和新鲜度压缩为安全的 `meta.audit` 合同；小程序聊天页以低干扰状态卡展示合同，不泄露内部实现。

## Technical Context

**Language/Version**: Node.js 20 / 微信小程序 JavaScript
**Primary Dependencies**: LangGraph、LangChain、微信云函数 SDK
**Storage**: 现有云数据库；不新增用户敏感数据表
**Testing**: Node 内置 `assert` 测试、JavaScript 语法检查
**Target Platform**: 微信小程序、微信云函数
**Project Type**: 小程序 + 云函数 Agent 工作流
**Performance Goals**: 审计计算为纯内存同步逻辑，不增加外部请求
**Constraints**: 兼容历史消息和当前协议版本，不改变模型调用链
**Scale/Scope**: 1 个云函数审计模块、1 个聊天页状态组件、2 组回归测试

## Constitution Check

- Source-First：通过，审计只消费已有来源字段。
- Evidence-Bounded AI：通过，状态不足时只降级，不提高可信度。
- Server-Enforced Permission：通过，不新增客户端权限。
- Observable and Testable：通过，状态可测试并写入已有 meta。

## Project Structure

```text
miniapp-1/cloudfunctions/rag/lib/audit.js
miniapp-1/cloudfunctions/rag/lib/workflow.js
miniapp-1/cloudfunctions/rag/test/audit.test.js
miniapp-1/pages/chat/index.js
miniapp-1/pages/chat/index.wxml
miniapp-1/pages/chat/index.wxss
```

**Structure Decision**: 沿用现有 RAG 工作流和聊天页，不引入新服务或新框架。

## Data Contract

```js
{
  status: 'verified' | 'partial' | 'insufficient' | 'not_required',
  label: string,
  evidenceCount: number,
  sourceCount: number,
  officialSourceCount: number,
  review: 'approved' | 'fallback' | 'unknown',
  degradation: string,
  action: string
}
```

## Complexity Tracking

无宪章例外。
