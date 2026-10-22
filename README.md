# 文检星 — 智能化标书合规校验工具

<p align="center">
  <strong>规则化技能校验 · AI 辅助审阅 · 六大维度合规检查</strong>
</p>

<p align="center">
  <img src="public/logo-icon.svg" width="120" height="120" alt="文检星 Logo">
</p>

<p align="center">
  <img alt="Vue" src="https://img.shields.io/badge/Vue_3-3.4-4FC08D?logo=vue.js&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white">
  <img alt="Express" src="https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white">
  <img alt="SQLite" src="https://img.shields.io/badge/SQLite-11-003B57?logo=sqlite&logoColor=white">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-yellow">
</p>

## 软件介绍

文检星是一款面向招投标场景的标书合规性校验工具。通过内置规则化技能包与可选 AI 模型，对投标文件进行完整性、规范性、合规性多维度检查，逐条呈现问题清单与修改建议，帮助投标人在提交前发现疏漏与风险。

**核心功能**

| 功能 | 说明 |
|------|------|
| 规则技能校验 | 内置项目信息 / 商务条款 / 技术要求 / 评分标准 / 封标要求 5 大技能包，逐条比对文档内容 |
| AI 辅助审阅 | 支持接入 DeepSeek / 通义千问 / OpenAI 等模型，对文档内容与合规要求进行 AI 分析 |
| 合规问题清单 | 按严重度（红/黄/绿）分级展示检查结论，逐条给出原文定位与修改建议 |
| 技能管理 | 支持导入、启用、禁用、删除本地技能，规则随文随改 |
| 模板管理 | 提供投标 / 商务 / 技术 三类模板，支持自定义上传 |
| 模型管理 | 多厂商模型 API Key 配置 + 连通性测试 |
| 导出 | 支持 Word / PDF / Markdown 三格式导出检查报告 |
| 设置中心 | 主题、规则、技能、模板、模型、导出、个性、关于 八个模块 |

## 技术实现

### 上传 → 技能校验 → 分级清单

系统采用前后端分离架构：Vue 3 前端负责文档上传、检查发起、结果展示与设置管理；Express 后端承担技能加载、规则匹配、结果聚合与导出。默认内置 5 大技能包（project-info / business-terms / tech-requirements / score-standard / seal-requirements），启动时从 `backend/seed-skills/` 自动同步至 SQLite 数据库，用户可通过设置中心导入自定义 `.md` / `.yaml` 技能包扩展校验能力。

### 前端架构

Vue 3 + TypeScript + Vite 单页应用，配合 Pinia 状态管理与 Element Plus 组件库。设置中心 8 大模块通过 `SettingsView` 与 `SettingsSidebar` 统一组织，`TopNav` / `PageFooter` 构成统一布局骨架，主题与强调色持久化于 localStorage。

### 后端模式

Express + TypeScript 提供服务端 API，SQLite（better-sqlite3）持久化技能、规则与 API Key，AES 加密存储敏感信息。支持技能 CRUD、批量导入、检查任务发起、AI 模型路由与连通性测试。

### Web 客户端

构建产物为纯静态文件，可部署到任意 Web 服务器（Nginx / Vercel / Netlify）。

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建静态文件
npm run build
```

---

## 声明

1. **使用目的**：本工具旨在辅助投标文件合规性检查，用户应自行核对最终结论的准确性。
2. **文档安全**：本地模式下所有文档处理均在用户环境内完成，不上传至任何第三方服务器；启用 AI 模型时，用户输入内容将发送至所配置的 API 端点。
3. **免责声明**：本工具按"现有状态"提供，不作任何形式的明示或默示保证。

## License

[MIT](./LICENSE)
