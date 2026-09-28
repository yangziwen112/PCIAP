# PCIAP Motion / GSAP 动效采用规范

## 1. 参考项目

- Motion：<https://github.com/motiondivision/motion>
- GSAP：<https://github.com/greensock/GSAP>

本规范记录两个开源项目的工程方法和可复用模式。使用前必须核对当前仓库版本、许可证和目标运行平台，不把整套依赖直接塞进微信小程序。

## 2. 技术选型

### React / Web / Electron

- 页面状态驱动的进入、退出、布局变化：优先 Motion 的声明式组件和 variants 思路。
- 时间轴、滚动联动、复杂序列、Canvas/SVG 和跨组件编排：优先 GSAP timeline、context 和 matchMedia 思路。
- 一个交互只选择一个动画引擎，避免同一节点被两个引擎同时写入 transform、opacity 或 height。

### 微信小程序

微信小程序没有浏览器 DOM，不能直接把 `motion/react` 或依赖 DOM 的 GSAP 插件打包进页面。PCIAP 使用以下适配策略：

1. 借鉴 Motion 的状态驱动和可取消过渡模型。
2. 使用小程序原生 WXSS transition、keyframes 和 `wx.createAnimation` 实现实际动画。
3. 需要复杂时间轴时拆成有限状态序列，不在运行时引入 DOM 依赖。
4. 动效必须能在低端设备降级为无动画，不影响内容阅读和点击。

## 3. 可复用的动效契约

```js
const MOTION_PRESETS = {
  pageEnter: { duration: 220, easing: 'ease-out', opacity: [0, 1], translateY: [12, 0] },
  cardPress: { duration: 120, easing: 'ease-out', scale: [1, 0.98] },
  feedback: { duration: 180, easing: 'ease-out', opacity: [0, 1], translateY: [6, 0] }
}
```

页面只引用预设，不在每个页面散落不同的时长和缓动曲线。数据加载、空状态和错误状态优先使用淡入或位移，不使用持续旋转和大幅弹跳。

## 4. PCIAP 页面规则

- 首页：首屏内容淡入一次；滚动信息不做逐条强制动画。
- AI 助手：消息发送后使用轻量状态反馈，不能让加载动画抢占输入焦点。
- 资讯列表：卡片进入使用 160–220ms 的小位移；分页加载不重排整个列表。
- 弹窗：遮罩淡入、内容轻微上移；关闭时先完成状态清理再销毁。
- 校园墙：点赞和提交只做一次性反馈，防止连续点击触发重复动画和重复请求。
- 用户隐私、权限和错误提示：不使用误导性的庆祝动画。

## 5. 性能和可访问性

- 只优先动画 `transform` 和 `opacity`，避免频繁改变布局属性。
- 列表动画必须有数量上限，长列表不逐项创建时间轴。
- 支持 `prefers-reduced-motion` 的 Web 页面；小程序提供无动画降级开关。
- 页面离开、组件卸载和请求取消时必须清理动画实例、监听器和 ScrollTrigger。
- 动效不能改变按钮的可点击区域，也不能遮挡错误提示和来源信息。
- 低性能设备或首屏超过预算时关闭非必要动画。

## 6. 验收指标

每个动效提交至少记录：触发条件、持续时间、影响属性、取消条件、低性能降级方式和验证设备。验收关注首屏可用时间、滚动帧率、重复点击次数、动画结束后的状态一致性，而不是“看起来更炫”。

## 7. 引入边界

Motion 和 GSAP 的代码、插件和示例不得未经核对直接复制到 PCIAP。优先采用官方包和最小 API；微信小程序优先使用平台原生实现。若确需引入依赖，必须同时更新包锁文件、许可证说明、体积评估和回滚方案。
