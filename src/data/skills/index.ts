// 本地内置技能数据 — 从 SKILL.md 文件解析
// 每个 SKILL.md 含 YAML frontmatter + Markdown 正文，正文作为 prompt content 使用

const SKILL_MAP: Record<string, { group: string; enabled: boolean }> = {
  'bid-clause-crosscheck':   { group: 'business', enabled: true },
  'bid-consistency-check':   { group: 'info',     enabled: true },
  'bid-content-audit':       { group: 'tech',     enabled: true },
  'bid-format-check':        { group: 'seal',      enabled: true },
  'bid-tender-risk-scan':    { group: 'business',  enabled: true },
};

const GROUP_LABELS: Record<string, string> = {
  info: '项目信息',
  business: '商务条款',
  tech: '技术条款',
  score: '评分标准',
  seal: '封标标准',
  star: '标星信息',
};

export interface SkillItem {
  id: string;
  name: string;
  description: string;
  group: string;
  type: 'rules' | 'prompt';
  fields: string[];
  content?: string;
  enabled: boolean;
  importedAt: string;
  rules: never[];
}

function parseSkillFile(id: string, raw: string): SkillItem {
  // 解析 YAML frontmatter
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const fmText = fmMatch ? fmMatch[1] : '';
  const body = fmMatch ? fmMatch[2].trim() : raw.trim();

  const nameMatch = fmText.match(/^name:\s*(.+)$/m);
  const descMatch = fmText.match(/^description:\s*(.+)$/m);

  const name = nameMatch?.[1]?.trim() || id;
  const description = descMatch?.[1]?.trim() || '';

  const meta = SKILL_MAP[id] || { group: 'info', enabled: true };

  return {
    id,
    name,
    description,
    group: meta.group,
    type: 'prompt',
    fields: [],
    content: body,
    enabled: meta.enabled,
    importedAt: new Date().toISOString(),
    rules: [],
  };
}

// 从 import.meta.glob 预加载的 raw 文本解析
const modules = import.meta.glob<unknown>('./*.md', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;

export const LOCAL_SKILLS: SkillItem[] = Object.entries(modules)
  .map(([path, raw]) => {
    const id = path.split('/').pop()!.replace('.md', '');
    return parseSkillFile(id, raw as string);
  })
  .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));

export const GROUP_LABEL_MAP = GROUP_LABELS;
