# PCIAP 项目元信息

发布与仓库维护遵循 [repository-growth-playbook.md](repository-growth-playbook.md)，状态记录在 [repository-growth.yml](repository-growth.yml)。

## 项目定位

PCIAP（民大通）是一个面向校园真实信息场景的微信小程序。它将官方通知、考试、竞赛、就业、校园动态和二手书等入口组织在同一套可追溯的信息流程中，并通过 AI 助手帮助用户理解“信息来自哪里、与谁有关、什么时候发生、下一步做什么”。

## 推荐仓库标签

```text
wechat-mini-program
cloud-development
campus-information
agent-workflow
rag
source-governance
langgraph
privacy-by-design
```

这些标签描述仓库能力，不代表每个模块都已完成生产部署。远程 GitHub Topics 仍需仓库维护者在 GitHub 设置页确认。

## 能力边界

- AI：负责意图识别、检索编排、来源解释和结果审核；不替代学校官方通知。
- 数据：优先展示可访问、可回溯的原文来源；采集失败时显示失败或过期状态。
- 权限：客户端只负责交互，敏感权限、数据访问和管理员判断由服务端完成。
- 隐私：不把密钥、用户身份凭证、私聊内容和真实截图作为公开样例。

## 发布检查清单

- [ ] 页面和云函数能够通过语法检查。
- [ ] RAG 测试覆盖有证据、无证据、过期信息和工具失败。
- [ ] 采集器保留来源链接与时间字段。
- [ ] 游客、普通用户、管理员路径分别验证。
- [ ] 公开仓库未包含 `project.private.config.json`、`.env`、`node_modules` 或密钥文件。

## 证据合同

AI 回答的 `meta.audit` 会把证据数量、来源数量、官方来源数量、审核状态和下一步动作压缩成四种用户可理解的状态：`verified`、`partial`、`insufficient`、`not_required`。它是产品解释层，不是学校官方认证；没有可靠来源时，界面明确要求用户打开原文核验。

本次实现还保留了原有引用展开、历史消息兼容和服务端权限边界；状态卡只展示安全摘要，不展示 token、提示词或原始图片地址。
