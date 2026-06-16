# 未来基金投后管理智能平台 POC

**Future Fund Portfolio Intelligence** 是一个面向国资基金、基金管理人和投资经理现场演示的投后管理智能平台 POC。

本项目使用模拟数据，不接入真实客户信息；默认采用本地规则引擎模拟 AI 能力，无需 API Key，可直接部署到 GitHub Pages。

## 在线演示地址

- GitHub Repository：https://github.com/Ecoforfreedom/Finance-Mam-
- GitHub Pages：https://ecoforfreedom.github.io/Finance-Mam-/#/
- 现场演示入口：https://ecoforfreedom.github.io/Finance-Mam-/#/interactive

## 核心功能

- 投后管理工作台：展示报告期指标、重点关注、项目分布和待办事项。
- 交互演示：一个页面串联 6 步现场演示，支持自然语言查询、条件联动、核验抽屉、跨期变化、协议履约和导出。
- 专题报送：支持自然语言条件解析、动态筛选、纳入/不纳入/待确认分组、Excel 导出和一页摘要。
- 进展与异常：支持跨季度比较、关键进展、信息问题、管理异常和建议动作。
- 协议履约：追踪协议条款、截止日期、履约状态、证据链和后续跟进。
- 项目库：表格/卡片视图、搜索筛选、项目详情和来源追溯。
- 材料中心：展示模拟投后材料、摘要、原文摘录、字段支持和冲突信息。
- 投资经理待办：标记完成、延后、查看证据、生成问询内容。
- 字段级核验层：所有关键结论可打开来源抽屉，查看来源文件、原文、置信度、冲突、过期和人工确认状态。

## 技术栈

- React + TypeScript + Vite
- React Router HashRouter
- Recharts
- SheetJS / XLSX
- Zustand
- Vitest
- GitHub Actions + GitHub Pages

## 本地运行

```bash
npm install
npm run dev
```

## 测试与构建

```bash
npm test
npm run build
```

## GitHub Pages 部署

仓库已包含 `.github/workflows/deploy.yml`。

推送到 `main` 或 `master` 后，GitHub Actions 会自动：

1. 安装依赖；
2. 执行测试；
3. 构建静态产物；
4. 上传并部署到 GitHub Pages。

项目使用 `HashRouter`，避免 GitHub Pages 刷新路由 404。

## 主要路由

- `#/` 工作台
- `#/interactive` 交互演示 / 现场 Demo 主入口
- `#/reporting` 专题报送
- `#/progress` 进展与异常
- `#/compliance` 协议履约
- `#/portfolio` 项目库
- `#/documents` 材料中心
- `#/tasks` 投资经理待办
- `#/settings` 数据与核验设置
- `#/summary` 管理层一页摘要 / 打印页

## 数据说明

- `src/data/masterData.json`：前端统一数据源。
- `public/data/master_data.json`：公开静态数据。
- `public/mock-documents/`：模拟材料与演示脚本。
- `未来基金_投后管理POC模拟数据/`：本地模拟投后材料包。

所有项目、企业、材料和事实均为模拟数据，仅用于产品演示。

## 可选 AI 接口

当前 POC 默认使用本地规则引擎：关键词识别、同义词匹配、规则筛选、状态计算、来源映射和模板化摘要。

如未来接入 OpenAI 兼容接口，请使用环境变量配置，不要将任何 API Key 写入代码或提交到 GitHub。

## 推荐演示路径

1. 打开 `#/interactive` 交互演示页，点击“开始 6 步演示”；
2. 系统自动填入“量子科技、A轮及以前且已在上海落地”的专题筛选；
3. 切换“上海注册并实际经营”口径，观察纳入/待确认/排除数量变化；
4. 点击待确认项目的“来源”，打开字段级核验抽屉查看证据缺口；
5. 查看同一项目的跨期进展、异常变化和协议信息；
6. 点击“导出当前结果”，生成专题报送 Excel；
7. 如需分模块深入，可继续进入 `#/reporting`、`#/progress`、`#/compliance` 和 `#/summary`。
