---
name: ui-motion-governance
description: PCIAP 前端 UI 动效规范。Web/React/Electron 优先参考 Motion 或 GSAP；微信小程序使用兼容的原生动画实现，并遵守性能、可访问性和 C/D 盘文件边界。
---

# UI Motion Governance

## 必须遵守

1. 先判断运行平台，再选 Motion、GSAP 或微信原生动画。
2. React/Web/Electron 页面：状态驱动的过渡优先 Motion；时间轴、滚动、Canvas/SVG 和复杂编排优先 GSAP。
3. 微信小程序：禁止直接引入依赖 DOM 的 Motion/GSAP 运行时代码；把其状态机、时间轴和清理思想改写为 WXSS 或 `wx.createAnimation`。
4. 同一元素只允许一个动画控制器写入同一属性。
5. 任何动画都要有取消、卸载和低性能降级路径。
6. 动效完成后必须验证按钮可用、数据状态不丢失、列表不重复请求。

## C/D 盘工作边界

- 新建或改动的 UI 文档、脚本和资源优先写入 `D:\AIWorkspace`。
- C 盘项目目录只有在确认可写、无进程占用并完成哈希校验后才同步。
- 不把绝对 C 盘路径写进项目配置；小程序使用相对的 `miniprogramRoot` 和 `cloudfunctionRoot`。
- 大体积依赖、镜像仓库和构建缓存放在 D 盘；C 盘只保留用户明确需要的入口或 Junction。

## 输出格式

每次设计或改造动效时，先说明：平台、主交互、选用引擎、降级方案、性能风险和验收方式；再修改代码。
