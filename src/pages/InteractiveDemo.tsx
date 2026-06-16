import { useMemo, useState } from 'react';
import { ArrowRight, Bot, CheckCircle2, Download, FileSearch, Filter, PlayCircle, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import { clauses, fieldSources, projects, sourcesFor, tasks, updates } from '../services/data';
import { defaultQuery, demoQueries, parseNaturalLanguage, runQuery } from '../services/rules';
import { StatusBadge } from '../components/ui';
import { useAppStore } from '../store';
import { exportExcel } from '../utils/export';
import type { Project, QueryCondition } from '../types/domain';

const conditionText = (condition: QueryCondition) => [
  condition.quantum && '量子科技',
  condition.aiForScience && 'AI for Science',
  condition.stageMax && `${condition.stageMax}及以前`,
  condition.shanghaiMode === 'landing' && '上海落地',
  condition.shanghaiMode === 'registration' && '上海工商注册',
  condition.shanghaiMode === 'operation' && '上海注册并实际经营',
  condition.recentFinancing && '本季度融资进展',
  condition.explicitOnly && '仅明确事实',
  condition.strict ? '严格口径' : '宽松口径'
].filter(Boolean) as string[];

function buildRows(items: Project[], adopted: string) {
  return items.map(p => ({
    项目名称: p.name,
    项目简称: p.shortName,
    行业: p.industry,
    融资阶段: p.financingStage,
    上海落地: p.shanghaiLandingStatus,
    本期状态: p.summary,
    当前灯号: p.portfolioStatus,
    信息完整度: `${p.completion}%`,
    判断口径: adopted,
    数据更新时间: p.lastUpdatedAt
  }));
}

export default function InteractiveDemo() {
  const openSource = useAppStore(s => s.openSource);
  const [query, setQuery] = useState(defaultQuery);
  const [condition, setCondition] = useState<QueryCondition>(() => parseNaturalLanguage(defaultQuery));
  const [tab, setTab] = useState<'included' | 'pending' | 'excluded'>('included');
  const [selected, setSelected] = useState<Project | undefined>();
  const [step, setStep] = useState(1);
  const [assistant, setAssistant] = useState('已准备好。请输入报送要求，或点击右侧演示步骤开始。');
  const result = useMemo(() => runQuery(condition), [condition]);
  const activeProject = selected || result.included[0] || result.pending[0]?.project || projects[0];
  const projectUpdates = updates.filter(u => u.projectId === activeProject.id).slice(0, 4);
  const projectClauses = clauses.filter(c => c.projectId === activeProject.id).slice(0, 3);
  const projectSources = sourcesFor(activeProject.id).slice(0, 4);

  const run = () => {
    const next = parseNaturalLanguage(query);
    setCondition(next);
    setTab('included');
    setAssistant(`已解析 ${conditionText(next).length} 个条件，形成 ${runQuery(next).included.length} 个纳入项目、${runQuery(next).pending.length} 个待确认项目。`);
  };
  const setShanghai = (mode: QueryCondition['shanghaiMode']) => {
    const next = { ...condition, shanghaiMode: mode };
    setCondition(next);
    setAssistant(mode === 'operation' ? '已切换为最严格落地口径：要求工商注册与实际经营证据，部分项目会进入待确认或排除。' : '已切换上海落地口径，结果已重新计算。');
  };
  const removeTag = (tag: string) => {
    const next = { ...condition };
    if (tag.includes('量子')) next.quantum = false;
    if (tag.includes('AI')) next.aiForScience = false;
    if (tag.includes('A轮')) next.stageMax = undefined;
    if (tag.includes('上海')) next.shanghaiMode = undefined;
    if (tag.includes('融资')) next.recentFinancing = false;
    if (tag.includes('明确')) next.explicitOnly = false;
    setCondition(next);
    setAssistant(`已删除条件「${tag}」，筛选结果已联动更新。`);
  };
  const startDemo = (nextStep = 1) => {
    setStep(nextStep);
    if (nextStep === 1) {
      const q = '请筛选量子科技、A轮及以前且已在上海落地的项目。';
      setQuery(q); setCondition(parseNaturalLanguage(q)); setTab('included');
      setAssistant('第 1 步：系统自动解析专题口径，并将项目分为纳入、不纳入、待确认。');
    }
    if (nextStep === 2) { setShanghai('operation'); setTab('pending'); }
    if (nextStep === 3) { setTab('pending'); setSelected(result.pending[0]?.project || activeProject); setAssistant('第 3 步：打开边界项目，查看园区意向、租赁、工商/社保证据缺口。'); }
    if (nextStep === 4) { setAssistant('第 4 步：右侧已展示跨期变化，突出工程样机延期、融资冲突和材料缺口。'); }
    if (nextStep === 5) { setAssistant('第 5 步：查看协议条款、截止日期、当前证据与建议问询动作。'); }
    if (nextStep === 6) exportCurrent();
  };
  const exportCurrent = () => exportExcel('未来基金_交互演示专题报送', {
    当前条件: conditionText(condition).map(x => ({ 条件: x })),
    纳入项目: buildRows(result.included, '纳入'),
    待确认项目: result.pending.map(x => ({ 项目: x.project.shortName, 待确认字段: x.fields.join('、'), 信息缺口: x.gap, 建议动作: x.ask })),
    不纳入项目: result.excluded.map(x => ({ 项目: x.project.shortName, 排除原因: x.reasons.join('；') })),
    来源说明: projectSources.map(s => ({ 字段: s.fieldName, 来源: s.documentTitle, 日期: s.materialDate, 原文: s.excerpt }))
  });

  const rows = tab === 'included' ? result.included.map(project => ({ project })) : tab === 'pending' ? result.pending : result.excluded;
  const doneTasks = tasks.filter(t => t.status === '待处理').slice(0, 3);
  return <div className="interactive-page grid">
    <section className="hero card">
      <div>
        <span className="badge blue"><Sparkles size={14}/> 前端可交互演示页 · Demo Mode</span>
        <h1>未来基金投后管理智能平台</h1>
        <p>用一个页面串联自然语言专题报送、规则筛选、来源核验、跨期进展、协议履约和导出，适合现场向基金管理人演示。</p>
        <div className="toolbar"><button className="btn primary" onClick={() => startDemo(1)}><PlayCircle size={16}/> 开始 6 步演示</button><button className="btn" onClick={run}><RefreshCw size={16}/> 运行当前查询</button><button className="btn" onClick={exportCurrent}><Download size={16}/> 导出当前结果</button></div>
      </div>
      <div className="hero-panel">
        <div className="metric">{result.included.length}/{projects.length}</div><div className="muted">当前纳入项目</div>
        <div className="mini-bars"><span style={{height:`${20+result.included.length*14}px`}}/><span style={{height:`${20+result.pending.length*14}px`}}/><span style={{height:`${20+result.excluded.length*4}px`}}/></div>
        <div className="toolbar"><span className="badge green">纳入 {result.included.length}</span><span className="badge yellow">待确认 {result.pending.length}</span><span className="badge red">排除 {result.excluded.length}</span></div>
      </div>
    </section>

    <section className="grid interactive-grid">
      <div className="card query-card">
        <div className="section-title"><h2><Bot size={20}/> 自然语言查询</h2><span className="badge blue">Local Rule Engine</span></div>
        <textarea className="input-lg" value={query} onChange={e => setQuery(e.target.value)} />
        <div className="toolbar">{demoQueries.slice(0, 5).map(q => <button key={q} className="btn" onClick={() => { setQuery(q); setCondition(parseNaturalLanguage(q)); }}>{q}</button>)}</div>
        <div className="section-title"><h3><Filter size={18}/> AI解析条件</h3><button className="btn" onClick={() => setCondition({ ...condition, strict: !condition.strict })}>{condition.strict ? '切换宽松口径' : '切换严格口径'}</button></div>
        <div className="toolbar">{conditionText(condition).map(t => <button key={t} className="badge blue" onClick={() => removeTag(t)}>{t} ×</button>)}<button className="badge" onClick={() => setCondition({ ...condition, recentFinancing: !condition.recentFinancing })}>+ 本季度融资</button><button className="badge" onClick={() => setCondition({ ...condition, explicitOnly: !condition.explicitOnly })}>+ 仅明确事实</button></div>
        <div className="segmented"><button className={condition.shanghaiMode === 'landing' ? 'active' : ''} onClick={() => setShanghai('landing')}>上海落地</button><button className={condition.shanghaiMode === 'registration' ? 'active' : ''} onClick={() => setShanghai('registration')}>工商注册</button><button className={condition.shanghaiMode === 'operation' ? 'active' : ''} onClick={() => setShanghai('operation')}>注册+实际经营</button></div>
        <div className="ai-answer"><b>AI助手结论</b><p>{assistant}</p><p className="muted">判断口径：{conditionText(condition).join(' / ') || '未设置条件'}。所有结论均可点击“来源”追溯。</p></div>
      </div>
      <div className="card demo-steps">
        <div className="section-title"><h2>演示流程</h2><span className="badge yellow">当前第 {step} 步</span></div>
        {['专题筛选','修改上海落地口径','查看待确认原因','查看跨期变化','查看协议履约','导出结果'].map((s, i) => <button key={s} className={step === i + 1 ? 'step active' : 'step'} onClick={() => startDemo(i + 1)}><span>{i + 1}</span><b>{s}</b><ArrowRight size={16}/></button>)}
        <div className="card soft"><b>现场讲解提示</b><p>这不是聊天机器人截图，而是规则引擎驱动的真实筛选、状态变化、来源核验和导出。</p></div>
      </div>
    </section>

    <section className="card">
      <div className="section-title"><h2>专题报送结果</h2><div className="tabs"><button className={tab === 'included' ? 'tab active' : 'tab'} onClick={() => setTab('included')}>纳入项目 {result.included.length}</button><button className={tab === 'pending' ? 'tab active' : 'tab'} onClick={() => setTab('pending')}>待确认 {result.pending.length}</button><button className={tab === 'excluded' ? 'tab active' : 'tab'} onClick={() => setTab('excluded')}>不纳入 {result.excluded.length}</button></div></div>
      <div className="result-cards">{rows.slice(0, 8).map((row: any) => { const p: Project = row.project; return <div key={p.id} className={`result-card ${selected?.id === p.id ? 'selected' : ''}`} onClick={() => setSelected(p)}><div className="section-title"><b>{p.shortName}</b><StatusBadge s={p.portfolioStatus}/></div><p>{p.industry} · {p.financingStage}</p><p className="muted">{tab === 'included' ? p.summary : tab === 'pending' ? `${row.fields.join('、')}：${row.gap}` : row.reasons.join('；')}</p><div className="toolbar"><button className="btn" onClick={(e) => { e.stopPropagation(); openSource(sourcesFor(p.id)[0] || fieldSources[0]); }}><FileSearch size={14}/> 来源</button><span className="badge blue">完整度 {p.completion}%</span></div></div>; })}</div>
    </section>

    <section className="grid detail-grid">
      <div className="card">
        <div className="section-title"><h2><ShieldCheck size={20}/> 选中项目核验面板</h2><span className="badge blue">{activeProject.shortName}</span></div>
        <div className="project-profile"><div><b>{activeProject.name}</b><p>{activeProject.technologies.join('、')}</p><p className="muted">{activeProject.shanghaiLandingStatus}</p></div><div className="metric">{activeProject.completion}%</div></div>
        <div className="source-list">{projectSources.map(s => <button key={s.id} className="source-row" onClick={() => openSource(s)}><span><b>{s.fieldName}</b><em>{s.documentTitle}</em></span><span className={s.hasConflict ? 'badge red' : s.requiresConfirmation ? 'badge yellow' : 'badge green'}>{s.hasConflict ? '冲突' : s.requiresConfirmation ? '待确认' : '明确事实'}</span></button>)}</div>
      </div>
      <div className="card">
        <div className="section-title"><h2>跨期进展与异常</h2><span className="badge yellow">信息与管理异常，不构成投资判断</span></div>
        <div className="timeline">{projectUpdates.map(u => <div key={u.id} className="item"><b>{u.changeSummary}</b><p className="muted">{u.previousState} → {u.currentState}</p><span className={u.status === 'progress' ? 'badge green' : u.status === 'anomaly' ? 'badge red' : 'badge yellow'}>{u.status === 'progress' ? '关键进展' : u.status === 'anomaly' ? '异常变化' : '信息问题'} · 置信度 {Math.round(u.confidence * 100)}%</span></div>)}</div>
      </div>
      <div className="card">
        <div className="section-title"><h2>协议履约追踪</h2><button className="btn" onClick={() => exportExcel('未来基金_演示页协议履约', { 协议履约: projectClauses })}>导出条款</button></div>
        {projectClauses.map(c => <div className="clause" key={c.id}><div className="section-title"><b>{c.clauseNumber} · {c.clauseType}</b><StatusBadge s={c.signal} label={c.status === 'completed' ? '已完成' : c.status === 'overdue' ? '已逾期' : c.status === 'unknown' ? '无法判断' : '进行中/待确认'}/></div><p>{c.obligation}</p><p className="muted">截止：{c.deadline || '持续义务'}｜证据：{c.latestEvidence}</p><button className="btn" onClick={() => openSource(sourcesFor(c.projectId)[0] || fieldSources[0])}>查看证据链</button></div>)}
      </div>
      <div className="card">
        <div className="section-title"><h2>投资经理待办</h2><span className="badge red">{doneTasks.length} 项待处理</span></div>
        {doneTasks.map(t => <div className="todo" key={t.id}><CheckCircle2 size={18}/><div><b>{t.title}</b><p className="muted">{t.projectName} · 截止 {t.deadline} · 联系 {t.contact}</p></div></div>)}
      </div>
    </section>
  </div>;
}