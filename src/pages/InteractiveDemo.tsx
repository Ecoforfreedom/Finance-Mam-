import { useMemo, useState } from 'react';
import { ArrowRight, Bot, CheckCircle2, Download, FileSearch, Filter, PlayCircle, RefreshCw, ShieldCheck, Sparkles, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { clauses, fieldSources, projects, sourcesFor, tasks, updates } from '../services/data';
import { defaultQuery, demoQueries, parseNaturalLanguage, runQuery } from '../services/rules';
import { StatusBadge } from '../components/ui';
import { useAppStore } from '../store';
import { exportExcel } from '../utils/export';
import type { Project, QueryCondition, TaskItem } from '../types/domain';

const conditionText = (condition: QueryCondition) => [
  condition.quantum && '量子科技',
  condition.aiForScience && '科技赛道',
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

interface TaskState {
  [id: string]: { status: 'pending' | 'completed' | 'deferred'; deferredDate?: string };
}

// 任务管理组件
function TaskManager({ tasks: initialTasks, onTaskUpdate }: { tasks: TaskItem[]; onTaskUpdate?: (state: TaskState) => void }) {
  const [taskState, setTaskState] = useState<TaskState>(() => {
    const saved = localStorage.getItem('taskState');
    return saved ? JSON.parse(saved) : {};
  });
  const [filter, setFilter] = useState<'all' | 'pending' | 'deferred' | 'completed'>('all');
  const [showDatePicker, setShowDatePicker] = useState<string | null>(null);

  const updateTask = (id: string, status: 'pending' | 'completed' | 'deferred', deferredDate?: string) => {
    const newState = {
      ...taskState,
      [id]: { status, deferredDate }
    };
    setTaskState(newState);
    localStorage.setItem('taskState', JSON.stringify(newState));
    onTaskUpdate?.(newState);
  };

  const getTaskStatus = (id: string) => taskState[id]?.status || 'pending';
  const getDeferredDate = (id: string) => taskState[id]?.deferredDate;

  const getTodayDate = () => new Date().toISOString().split('T')[0];
  const getTomorrowDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };
  const get3DaysLaterDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  };

  const filteredTasks = initialTasks.filter(t => {
    const st = getTaskStatus(t.id);
    if (filter === 'all') return true;
    return st === filter;
  });

  const pendingCount = initialTasks.filter(t => getTaskStatus(t.id) === 'pending').length;
  const deferredCount = initialTasks.filter(t => getTaskStatus(t.id) === 'deferred').length;
  const completedCount = initialTasks.filter(t => getTaskStatus(t.id) === 'completed').length;

  return (
    <div>
      <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button className={filter === 'all' ? 'badge active' : 'badge'} onClick={() => setFilter('all')} style={{ cursor: 'pointer' }}>
          全部 ({initialTasks.length})
        </button>
        <button className={filter === 'pending' ? 'badge active' : 'badge'} onClick={() => setFilter('pending')} style={{ cursor: 'pointer' }}>
          待处理 ({pendingCount})
        </button>
        <button className={filter === 'deferred' ? 'badge active' : 'badge'} onClick={() => setFilter('deferred')} style={{ cursor: 'pointer' }}>
          已延后 ({deferredCount})
        </button>
        <button className={filter === 'completed' ? 'badge active' : 'badge'} onClick={() => setFilter('completed')} style={{ cursor: 'pointer' }}>
          已完成 ({completedCount})
        </button>
      </div>

      {filteredTasks.map(t => {
        const status = getTaskStatus(t.id);
        const deferredDate = getDeferredDate(t.id);
        return (
          <div key={t.id} className="todo" style={{ opacity: status === 'completed' ? 0.6 : 1, textDecoration: status === 'completed' ? 'line-through' : 'none' }}>
            <input
              type="checkbox"
              checked={status === 'completed'}
              onChange={(e) => updateTask(t.id, e.target.checked ? 'completed' : 'pending')}
              style={{ cursor: 'pointer', marginRight: '12px', width: '18px', height: '18px' }}
            />
            <div style={{ flex: 1 }}>
              <b>{t.title}</b>
              <p className="muted">{t.projectName} · 截止 {deferredDate || t.deadline} · 联系 {t.contact}</p>
              {status === 'deferred' && <span className="badge yellow" style={{ marginRight: '8px' }}>已延后至 {deferredDate}</span>}
              {status === 'completed' && <span className="badge green">已完成</span>}
            </div>
            {status !== 'completed' && (
              <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
                <button className="btn" onClick={() => setShowDatePicker(showDatePicker === t.id ? null : t.id)} style={{ padding: '6px 12px', fontSize: '12px', minWidth: '70px' }}>
                  <Clock size={14} /> 延后
                </button>
                {showDatePicker === t.id && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    background: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '12px',
                    marginTop: '4px',
                    zIndex: 10,
                    minWidth: '200px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    <button className="btn" style={{ width: '100%', marginBottom: '8px', textAlign: 'left' }} onClick={() => { updateTask(t.id, 'deferred', getTomorrowDate()); setShowDatePicker(null); }}>
                      延后至明天
                    </button>
                    <button className="btn" style={{ width: '100%', marginBottom: '8px', textAlign: 'left' }} onClick={() => { updateTask(t.id, 'deferred', get3DaysLaterDate()); setShowDatePicker(null); }}>
                      延后 3 天
                    </button>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input type="date" onChange={(e) => { if (e.target.value) { updateTask(t.id, 'deferred', e.target.value); setShowDatePicker(null); } }} style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #ddd' }} />
                      <button className="btn" onClick={() => setShowDatePicker(null)}>关闭</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// 六步演示导航组件
interface GuidedTourProps {
  isActive: boolean;
  currentStep: number;
  onStepChange: (step: number) => void;
  onClose: () => void;
}

function GuidedTour({ isActive, currentStep, onStepChange, onClose }: GuidedTourProps) {
  if (!isActive) return null;

  const steps = [
    {
      title: '第 1 步：选择报送任务',
      description: '输入您需要处理的专题任务或业务需求，例如选择特定行业、融资阶段或区域。系统将自动解析自然语言。'
    },
    {
      title: '第 2 步：AI 拆解筛选条件',
      description: '系统将您的需求自动拆解为量子科技、科技赛道、融资阶段、地区等多个筛选条件，展示条件组合效果。'
    },
    {
      title: '第 3 步：查看匹配项目',
      description: '系统筛选并显示符合条件的纳入项目，以及需要进一步核验的待确认项目。您可以点击每个项目查看详情。'
    },
    {
      title: '第 4 步：核验进展与异常',
      description: '查看各项目的跨期进展、异常变化和信息问题。点击"查看来源"核验每项信息的原始证据和出处。'
    },
    {
      title: '第 5 步：处理投资经理待办',
      description: '在"投资经理待办"中勾选完成的任务、延后需要处理的事项，系统自动记录状态并支持导出。'
    },
    {
      title: '第 6 步：生成报送结果',
      description: '系统整理项目结果、风险事项和待确认内容，形成最终报送材料。点击"导出当前结果"生成 Excel 文件。'
    }
  ];

  const step = steps[currentStep - 1];

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'white',
      border: '2px solid #0066cc',
      borderRadius: '8px',
      padding: '20px',
      maxWidth: '400px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
      zIndex: 1000
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#0066cc' }}>
          {step?.title}
        </span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>
          ✕
        </button>
      </div>
      <p style={{ fontSize: '14px', color: '#333', marginBottom: '16px', lineHeight: 1.5 }}>
        {step?.description}
      </p>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
        <button
          className="btn"
          onClick={() => onStepChange(currentStep - 1)}
          disabled={currentStep === 1}
          style={{ cursor: currentStep === 1 ? 'not-allowed' : 'pointer', opacity: currentStep === 1 ? 0.5 : 1 }}
        >
          <ChevronLeft size={16} /> 上一步
        </button>
        <div style={{ fontSize: '12px', color: '#666', alignSelf: 'center' }}>
          {currentStep} / {steps.length}
        </div>
        {currentStep < steps.length ? (
          <button className="btn primary" onClick={() => onStepChange(currentStep + 1)}>
            下一步 <ChevronRight size={16} />
          </button>
        ) : (
          <button className="btn primary" onClick={onClose}>
            完成演示
          </button>
        )}
      </div>
      <button
        className="btn"
        onClick={onClose}
        style={{ width: '100%', marginTop: '12px' }}
      >
        跳过演示
      </button>
    </div>
  );
}

export default function InteractiveDemo() {
  const openSource = useAppStore(s => s.openSource);
  const [query, setQuery] = useState(defaultQuery);
  const [condition, setCondition] = useState<QueryCondition>(() => parseNaturalLanguage(defaultQuery));
  const [tab, setTab] = useState<'included' | 'pending' | 'excluded'>('included');
  const [selected, setSelected] = useState<Project | undefined>();
  const [step, setStep] = useState(0);
  const [guidedTourActive, setGuidedTourActive] = useState(false);
  const [assistant, setAssistant] = useState('已准备好。请输入报送要求，或点击"开启六步演示"了解产品功能。');
  const [taskState, setTaskState] = useState<any>({});

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
    if (tag.includes('科技')) next.aiForScience = false;
    if (tag.includes('A轮')) next.stageMax = undefined;
    if (tag.includes('上海')) next.shanghaiMode = undefined;
    if (tag.includes('融资')) next.recentFinancing = false;
    if (tag.includes('明确')) next.explicitOnly = false;
    setCondition(next);
    setAssistant(`已删除条件「${tag}」，筛选结果已联动更新。`);
  };

  const startGuidedTour = () => {
    setGuidedTourActive(true);
    setStep(1);
    const q = '请筛选量子科技、A轮及以前且已在上海落地的项目。';
    setQuery(q);
    setCondition(parseNaturalLanguage(q));
    setTab('included');
    setAssistant('演示已启动。请按照右下方的步骤指引了解产品功能。');
  };

  const handleGuidedStepChange = (newStep: number) => {
    setStep(newStep);
    if (newStep === 3) {
      setTab('pending');
      setSelected(result.pending[0]?.project || activeProject);
      setAssistant('第 3 步：打开待确认项目，查看需要进一步核验的信息。');
    } else if (newStep === 4) {
      setAssistant('第 4 步：查看右侧"跨期进展与异常"模块，每项信息均可点击查看来源。');
    } else if (newStep === 5) {
      setAssistant('第 5 步：在下方"投资经理待办"中试试勾选完成或延后任务。');
    } else if (newStep === 6) {
      setAssistant('第 6 步：点击"导出当前结果"生成完整的报送材料。');
    }
  };

  const exportCurrent = () => exportExcel('未来基金_交互演示专题报送', {
    当前条件: conditionText(condition).map(x => ({ 条件: x })),
    纳入项目: buildRows(result.included, '纳入'),
    待确认项目: result.pending.map(x => ({ 项目: x.project.shortName, 待确认字段: x.fields.join('、'), 信息缺口: x.gap, 建议动作: x.ask })),
    不纳入项目: result.excluded.map(x => ({ 项目: x.project.shortName, 排除原因: x.reasons.join('；') })),
    来源说明: projectSources.map(s => ({ 字段: s.fieldName, 来源: s.documentTitle, 日期: s.materialDate, 原文: s.excerpt }))
  });

  const rows = tab === 'included' ? result.included.map(project => ({ project })) : tab === 'pending' ? result.pending : result.excluded;

  const pendingTaskCount = tasks.filter(t => {
    const st = taskState[t.id]?.status || 'pending';
    return st === 'pending';
  }).length;

  return <div className="interactive-page grid">
    <section className="hero card">
      <div>
        <span className="badge blue"><Sparkles size={14} /> 交互演示页</span>
        <h1>未来基金投后管理智能平台</h1>
        <p>用一个页面串联自然语言专题报送、规则筛选、来源核验、跨期进展、协议履约和导出，适合现场向基金管理人演示。</p>
        <div className="toolbar"><button className="btn primary" onClick={startGuidedTour}><PlayCircle size={16} /> 开启六步演示</button><button className="btn" onClick={run}><RefreshCw size={16} /> 运行当前查询</button><button className="btn" onClick={exportCurrent}><Download size={16} /> 导出当前结果</button></div>
      </div>
      <div className="hero-panel">
        <div className="metric">{result.included.length}/{projects.length}</div><div className="muted">当前纳入项目</div>
        <div className="mini-bars"><span style={{ height: `${20 + result.included.length * 14}px` }} /><span style={{ height: `${20 + result.pending.length * 14}px` }} /><span style={{ height: `${20 + result.excluded.length * 4}px` }} /></div>
        <div className="toolbar"><span className="badge green">纳入 {result.included.length}</span><span className="badge yellow">待确认 {result.pending.length}</span><span className="badge red">排除 {result.excluded.length}</span></div>
      </div>
    </section>

    <section className="grid interactive-grid">
      <div className="card query-card">
        <div className="section-title"><h2><Bot size={20} /> 自然语言查询</h2></div>
        <textarea className="input-lg" value={query} onChange={e => setQuery(e.target.value)} placeholder="输入您的筛选需求..." />
        <div className="toolbar">{demoQueries.slice(0, 5).map(q => <button key={q} className="btn" onClick={() => { setQuery(q); setCondition(parseNaturalLanguage(q)); }}>{q}</button>)}</div>
        <div className="section-title"><h3><Filter size={18} /> 筛选条件</h3><button className="btn" onClick={() => setCondition({ ...condition, strict: !condition.strict })}>{condition.strict ? '切换宽松口径' : '切换严格口径'}</button></div>
        <div className="toolbar">{conditionText(condition).map(t => <button key={t} className="badge blue" onClick={() => removeTag(t)}>{t} ×</button>)}<button className="badge" onClick={() => setCondition({ ...condition, recentFinancing: !condition.recentFinancing })}>+ 本季度融资</button><button className="badge" onClick={() => setCondition({ ...condition, explicitOnly: !condition.explicitOnly })}>+ 仅明确事实</button></div>
        <div className="segmented"><button className={condition.shanghaiMode === 'landing' ? 'active' : ''} onClick={() => setShanghai('landing')}>上海落地</button><button className={condition.shanghaiMode === 'registration' ? 'active' : ''} onClick={() => setShanghai('registration')}>工商注册</button><button className={condition.shanghaiMode === 'operation' ? 'active' : ''} onClick={() => setShanghai('operation')}>注册+实际经营</button></div>
        <div className="ai-answer"><b>系统结论</b><p>{assistant}</p><p className="muted">判断口径：{conditionText(condition).join(' / ') || '未设置条件'}。所有结论均可点击"查看来源"追溯。</p></div>
      </div>
    </section>

    <section className="card">
      <div className="section-title"><h2>专题报送结果</h2><div className="tabs"><button className={tab === 'included' ? 'tab active' : 'tab'} onClick={() => setTab('included')}>纳入项目 {result.included.length}</button><button className={tab === 'pending' ? 'tab active' : 'tab'} onClick={() => setTab('pending')}>待确认 {result.pending.length}</button><button className={tab === 'excluded' ? 'tab active' : 'tab'} onClick={() => setTab('excluded')}>不纳入 {result.excluded.length}</button></div></div>
      <div className="result-cards">{rows.slice(0, 8).map((row: any) => { const p: Project = row.project; return <div key={p.id} className={`result-card ${selected?.id === p.id ? 'selected' : ''}`} onClick={() => setSelected(p)}><div className="section-title"><b>{p.shortName}</b><StatusBadge s={p.portfolioStatus} /></div><p>{p.industry} · {p.financingStage}</p><p className="muted">{tab === 'included' ? p.summary : tab === 'pending' ? `${row.fields.join('、')}：${row.gap}` : row.reasons.join('；')}</p><div className="toolbar"><button className="btn" onClick={(e) => { e.stopPropagation(); openSource(sourcesFor(p.id)[0] || fieldSources[0]); }} style={{ minWidth: '90px', whiteSpace: 'nowrap' }}><FileSearch size={14} /> 查看来源</button><span className="badge blue">完整度 {p.completion}%</span></div></div>; })}</div>
    </section>

    <section className="grid detail-grid">
      <div className="card">
        <div className="section-title"><h2><ShieldCheck size={20} /> 选中项目核验面板</h2><span className="badge blue">{activeProject.shortName}</span></div>
        <div className="project-profile"><div><b>{activeProject.name}</b><p>{activeProject.technologies.join('、')}</p><p className="muted">{activeProject.shanghaiLandingStatus}</p></div><div className="metric">{activeProject.completion}%</div></div>
        <div className="source-list">{projectSources.map(s => <button key={s.id} className="source-row" onClick={() => openSource(s)}><span><b>{s.fieldName}</b><em>{s.documentTitle}</em></span><span className={s.hasConflict ? 'badge red' : s.requiresConfirmation ? 'badge yellow' : 'badge green'}>{s.hasConflict ? '冲突' : s.requiresConfirmation ? '待确认' : '明确事实'}</span></button>)}</div>
      </div>
      <div className="card">
        <div className="section-title"><h2>跨期进展与异常</h2><span className="badge yellow">信息与管理异常，不构成投资判断</span></div>
        <div className="timeline">{projectUpdates.map(u => <div key={u.id} className="item"><b>{u.changeSummary}</b><p className="muted">{u.previousState} → {u.currentState}</p><span className={u.status === 'progress' ? 'badge green' : u.status === 'anomaly' ? 'badge red' : 'badge yellow'}>{u.status === 'progress' ? '关键进展' : u.status === 'anomaly' ? '异常变化' : '信息问题'} · 置信度 {Math.round(u.confidence * 100)}%</span></div>)}</div>
      </div>
      <div className="card">
        <div className="section-title"><h2>协议履约追踪</h2><button className="btn" onClick={() => exportExcel('未来基金_演示页协议履约', { 协议履约: projectClauses })}>导出条款</button></div>
        {projectClauses.map(c => <div className="clause" key={c.id}><div className="section-title"><b>{c.clauseNumber} · {c.clauseType}</b><StatusBadge s={c.signal} label={c.status === 'completed' ? '已完成' : c.status === 'overdue' ? '已逾期' : c.status === 'unknown' ? '无法判断' : '进行中/待确认'} /></div><p>{c.obligation}</p><p className="muted">截止：{c.deadline || '持续义务'}｜证据：{c.latestEvidence}</p><button className="btn" onClick={() => openSource(sourcesFor(c.projectId)[0] || fieldSources[0])} style={{ minWidth: '90px', whiteSpace: 'nowrap' }}>查看来源</button></div>)}
      </div>
      <div className="card">
        <div className="section-title"><h2>投资经理待办</h2><span className="badge red">{pendingTaskCount} 项待处理</span></div>
        <TaskManager tasks={tasks} onTaskUpdate={setTaskState} />
      </div>
    </section>

    <GuidedTour
      isActive={guidedTourActive}
      currentStep={step}
      onStepChange={handleGuidedStepChange}
      onClose={() => setGuidedTourActive(false)}
    />
  </div>;
}
