# PCIAP AI 产品工程参考基线

本文件记录本次维护实际查阅的开源项目和吸收范围。参考项目只用于学习工程方法，不把其代码直接复制进微信小程序，也不把浏览器 DOM 依赖塞入小程序运行时。

## 参考项目

| 项目 | 本地镜像 | 本次吸收的做法 |
| --- | --- | --- |
| [unibestX](https://github.com/cq112233/unibestX) | `D:\ai-mirror\unibestX` | 页面状态分层、请求封装、组件化和小程序工程组织 |
| [Motion](https://github.com/motiondivision/motion) | `D:\ai-mirror\motion` | 状态驱动动效、可取消、reduced-motion 思路 |
| [GSAP](https://github.com/greensock/GSAP) | `D:\ai-mirror\GSAP` | 时间线拆解、只动画 transform/opacity 的性能原则 |
| [LangGraph.js](https://github.com/langchain-ai/langgraphjs) | `D:\ai-mirror\langgraphjs` | 状态图、节点边界、一次重试和可观测 trace |
| [Microsoft GraphRAG](https://github.com/microsoft/graphrag) | `D:\ai-mirror\graphrag` | 结构化元数据、分层检索、来源与上下文分离 |

## PCIAP 的落地边界

1. 小程序端使用 WXSS 与平台原生能力实现动效；Motion/GSAP 只作为交互设计方法参考。
2. Agent 先完成情境识别和确定性路由，再检索证据，最后经过回答审核；模型不可用时走本地规则降级。
3. 知识库结果携带 `retrievalScore`、`retrievalConfidence` 和 `matchFields`，便于解释“为什么命中”。
4. 证据排序同时考虑标题、行动项、摘要、正文、标签、来源、官方标记、链接和新鲜度；排序不是把发布时间当作相关性。
5. 真实业务数据不足时返回 `no_match` 或 `unavailable`，不使用样例内容补齐答案。

## 本次验收指标

- 相关问题中，标题或行动项明确命中的记录应优先于仅有新发布时间的泛资讯。
- 相同 `requestId` 的 AI 请求重复到达时，不重复写入 assistant 消息。
- 多图上传并行执行，单图失败不阻断其他图片；最多保留 4 张。
- 首页切换栏目或搜索时，旧请求返回结果不能覆盖新筛选条件。
- 低性能设备关闭非必要动效，不影响输入、发送、来源查看和重试。
