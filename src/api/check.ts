import apiClient from './client';
import { uploadFile } from './upload';

export interface CheckItem {
  field: string;
  group: string;
  招标要求: string;
  所在页招: string;
  所在页投: string;
  投标响应: string;
  status: 'pass' | 'warning' | 'risk';
  /** 招标文件中该字段所在的原始段落，供鼠标悬停查看依据 */
  招标原文?: string;
  投标原文?: string;
  /** 招标/投标文件中该字段所属章节 */
  招标章节?: string;
  投标章节?: string;
}

export interface CheckResult {
  招标文件: { filename: string; jobId: string };
  投标文件: { filename: string; jobId: string };
  mode: 'rule_only' | 'llm_enhanced';
  items: CheckItem[];
  summary: { total: number; pass: number; warning: number; risk: number };
  checkTime: string;
}

/** 导出检查结果为 Markdown 文件 */
export async function downloadCheckResultMarkdown(jobId: string): Promise<void> {
  const res = await apiClient.get(`/upload/export/${jobId}`, {
    params: { format: 'markdown' },
    responseType: 'blob',
  });
  const url = URL.createObjectURL(new Blob([res.data], { type: 'text/markdown;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `标书检查结果_${jobId.slice(0, 8)}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

/** 在空白页预览上传的招标文件 */
export function previewFile(jobId: string): void {
  window.open(`/api/upload/file/${encodeURIComponent(jobId)}`, '_blank');
}

/**
 * 并行上传两个文件并提取结果。
 * 抽取模式由后端判定：前端不读取技能列表、不传 skill_id，
 * 后端若已配置模型且启用了技能则自动走 LLM 智能增强，
 * 实际模式从响应中的 extractMode 读取。
 *
 * 上传接口本身已返回完整提取结果，这里一并带出，避免再请求一次状态接口。
 */
export async function runCheck(
  fileA: File,
  fileB: File,
): Promise<{
  jobIdA: string;
  jobIdB: string;
  mode: 'rule_only' | 'llm_enhanced';
  resultA: any;
  resultB: any;
  warnings: string[];
}> {
  const [resA, resB] = await Promise.all([
    uploadFile(fileA),
    uploadFile(fileB),
  ]);
  const enhanced =
    resA.result.extractMode === 'llm_enhanced' || resB.result.extractMode === 'llm_enhanced';
  return {
    jobIdA: resA.id,
    jobIdB: resB.id,
    mode: enhanced ? 'llm_enhanced' : 'rule_only',
    resultA: resA.result,
    resultB: resB.result,
    warnings: [...(resA.warnings || []), ...(resB.warnings || [])],
  };
}

/** 从两个提取结果中生成对比条目 */
export function buildCheckResult(
  resultA: any,
  resultB: any,
  filenameA: string,
  filenameB: string,
  mode: 'rule_only' | 'llm_enhanced',
): CheckResult {
  const extractsA = resultA?.extractResult || resultA?.extracts || {};
  const extractsB = resultB?.extractResult || resultB?.extracts || {};
  const fieldGroups = resultA?.fieldGroups || {};

  const allFields = new Set([...Object.keys(extractsA), ...Object.keys(extractsB)]);
  const items: CheckItem[] = [];

  for (const field of [...allFields].sort()) {
    const valA = extractsA[field]?.value ?? null;
    const valB = extractsB[field]?.value ?? null;

    // 两侧都未抽取到内容的字段没有可比性，跳过以免结果被大量空行淹没
    if (valA === null && valB === null) continue;

    const group = fieldGroups[field] || extractsA[field]?.group || extractsB[field]?.group || 'info';

    // 是否与废标/否决类强约束相关（金额、保证金、资格类条款不响应或不符合即可能被否决）
    const isRiskField = ['废标', '否决', '无效', '★', '强制', '必须', '保证金', '资格要求'].some(
      k => field.includes(k),
    );

    // 两侧都有值但不一致，或仅一侧有值（另一侧未响应），均视为存在差异
    const differs =
      (valA !== null && valB !== null && valA !== valB) ||
      (valA !== null) !== (valB !== null);

    const status: 'pass' | 'warning' | 'risk' = differs
      ? isRiskField ? 'risk' : 'warning'
      : 'pass';

    items.push({
      field,
      group,
      招标要求: valA ?? '',
      所在页招: extractsA[field]?.page ? `P${extractsA[field].page}` : '',
      所在页投: extractsB[field]?.page ? `P${extractsB[field].page}` : '',
      投标响应: valB ?? '',
      status,
      招标原文: extractsA[field]?.sourceText,
      投标原文: extractsB[field]?.sourceText,
      招标章节: extractsA[field]?.chapter,
      投标章节: extractsB[field]?.chapter,
    });
  }

  const pass = items.filter(i => i.status === 'pass').length;
  const warning = items.filter(i => i.status === 'warning').length;
  const risk = items.filter(i => i.status === 'risk').length;

  const now = new Date();
  const checkTime = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  return {
    招标文件: { filename: filenameA, jobId: '' },
    投标文件: { filename: filenameB, jobId: '' },
    mode,
    items,
    summary: { total: items.length, pass, warning, risk },
    checkTime,
  };
}
