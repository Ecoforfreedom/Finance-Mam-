# 未来基金投后管理智能平台 POC

**Future Fund Portfolio Intelligence** 是一个面向国资基金、基金管理人和投资经理现场演示的投后管理智能平台 POC。

本项目使用模拟数据，不接入真实客户信息；默认采用本地规则引擎模拟 AI 能力，无需 API Key，可直接部署到 GitHub Pages。

## 核心功能

- 投后管理工作台：展示报告期指标、重点关注、项目分布和待办事项。
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

1. 打开工作台并点击“进入演示模式”；
2. 进入专题报送，运行“量子科技、A轮及以前、上海落地”筛选；
3. 修改上海落地口径，展示结果变化；
4. 查看待确认项目来源和证据缺口；
5. 进入进展与异常，展示跨期变化与异常识别；
6. 进入协议履约，查看条款、证据链和建议动作；
7. 导出 Excel，并打开管理层一页摘要打印页。
