import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const raw = JSON.parse(readFileSync(new URL('../src/data/masterData.json', import.meta.url), 'utf-8'));

const cnStatus = (v) => (v === '是' ? 'yes' : v === '否' ? 'no' : 'uncertain');
const projects = raw.projects.map((p) => ({
  id: p['项目编号'],
  shortName: p['企业简称'],
  aiForScienceStatus: cnStatus(p['是否属于AI for Science']),
  quantumStatus: cnStatus(p['是否属于量子科技']),
  financingStage: p['当前融资轮次'],
  lastFinancingDate: p['最近一轮融资日期'],
  shanghaiLandingStatus: p['上海落地状态'],
  actualOperationInShanghai:
    p['上海落地状态'].includes('实际经营') || p['上海落地状态'].includes('研发人员') || p['上海落地状态'].includes('入驻')
      ? true
      : p['上海落地状态'].includes('未') || p['上海落地状态'].includes('意向')
        ? false
        : null
}));

const stageRank = (s) =>
  s.includes('种子') ? 0 : s.includes('天使') ? 1 : s.includes('Pre-A') ? 2 : s === 'A轮' || (s.includes('A轮') && !s.includes('A+') && !s.includes('战略')) ? 3 : s.includes('A+') ? 4 : s.includes('B') ? 5 : 6;

function parseNaturalLanguage(q) {
  const condition = { strict: true };
  if (/AI\s*for\s*Science|AI.*Science|科学/.test(q)) condition.aiForScience = true;
  if (/量子/.test(q)) condition.quantum = true;
  if (/A轮及以前|A轮以前|早期/.test(q)) condition.stageMax = 'A轮';
  if (/A\+轮及以前/.test(q)) condition.stageMax = 'A+轮';
  if (/上海/.test(q)) condition.shanghaiMode = /工商注册|注册/.test(q) ? 'registration' : /实际经营|开展实际经营|人员/.test(q) ? 'operation' : 'landing';
  if (/融资|交割/.test(q) && /过去|最近|本季度|季度/.test(q)) condition.recentFinancing = true;
  if (/明确写明|明确事实|严格/.test(q)) condition.explicitOnly = true;
  return condition;
}

function classifyProject(p, c) {
  const reasons = [];
  const pending = [];
  if (c.aiForScience) {
    if (p.aiForScienceStatus === 'no') reasons.push('不属于AI for Science');
    if (p.aiForScienceStatus === 'uncertain') pending.push('AI for Science边界');
  }
  if (c.quantum) {
    if (p.quantumStatus === 'no') reasons.push('不属于量子科技');
    if (p.quantumStatus === 'uncertain') pending.push('量子科技判断');
  }
  if (c.stageMax) {
    const max = c.stageMax === 'A+轮' ? 4 : 3;
    if (/冲突|\//.test(p.financingStage)) pending.push('融资轮次存在冲突');
    else if (stageRank(p.financingStage) > max) reasons.push('融资阶段不符合');
  }
  if (c.shanghaiMode === 'landing') {
    const s = p.shanghaiLandingStatus;
    if (/未在上海|口头计划/.test(s)) reasons.push('未完成上海落地');
    if (/意向|租赁|证明不足|未设独立法人|延期/.test(s)) pending.push('上海落地证据不足或口径不清');
  }
  if (c.shanghaiMode === 'operation') {
    const s = p.shanghaiLandingStatus;
    if (!p.actualOperationInShanghai) reasons.push('未证明在上海开展实际经营');
    if (p.actualOperationInShanghai === null || /部分|证明不足/.test(s)) pending.push('上海实际经营证据不足');
  }
  return { reasons, pending };
}

function runQuery(condition) {
  const included = [];
  const excluded = [];
  const pending = [];
  for (const p of projects) {
    const r = classifyProject(p, condition);
    if (r.reasons.length) excluded.push(p);
    else if (r.pending.length) pending.push(p);
    else included.push(p);
  }
  return { included, excluded, pending };
}

const c = parseNaturalLanguage('哪些项目同时满足量子科技、A轮及以前、上海落地？');
assert.equal(c.quantum, true);
assert.equal(c.stageMax, 'A轮');
assert.equal(c.shanghaiMode, 'landing');

const landing = runQuery(parseNaturalLanguage('量子科技、A轮及以前、上海落地'));
const operation = runQuery(parseNaturalLanguage('量子科技、A轮及以前、上海开展实际经营'));
assert.ok(landing.included.length + landing.pending.length >= operation.included.length);

const ai = runQuery(parseNaturalLanguage('哪些项目属于AI for Science？'));
assert.ok(ai.included.length > 0, 'AI for Science应返回明确纳入项目');
assert.ok(ai.pending.length > 0, 'AI for Science应返回边界待确认项目');

console.log('✓ 本地规则引擎测试通过：自然语言解析、口径联动、AI for Science边界判断');