<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import TopNav from '@/components/layout/TopNav.vue';
import Pagination from '@/components/Pagination.vue';
import { ElMessage, ElMessageBox } from '@/utils/toast';
import { downloadCheckResultMarkdown, previewFile } from '@/api/check';
import type { CheckItem, CheckResult } from '@/api/check';

const router = useRouter();
const result = ref<CheckResult | null>(null);

// ── 分类侧栏 ─────────────────────────────────────────────
const CATEGORIES = [
  { key: 'all', label: '全部检查项', count: 0, color: '#4A72A8' },
  { key: 'info', label: '项目信息', count: 0, color: '#4A72A8' },
  { key: 'business', label: '废标项检查', count: 0, color: '#C0392B' },
  { key: 'tech', label: '一致性检查', count: 0, color: '#C6A45C' },
  { key: 'score', label: '遗漏项检查', count: 0, color: '#8A8578' },
  { key: 'seal', label: '响应性检查', count: 0, color: '#8A8578' },
  { key: 'star', label: '标星条款', count: 0, color: '#E74C3C' },
];

const activeCategory = ref('all');

const filteredItems = computed(() =>
  activeCategory.value === 'all'
    ? result.value?.items ?? []
    : result.value?.items.filter(i => i.group === activeCategory.value) ?? [],
);

// 更新分类计数
onMounted(() => {
  try {
    const raw = sessionStorage.getItem('bidchecker.checkResult');
    if (raw) {
      result.value = JSON.parse(raw) as CheckResult;
      // 计算各类别数量（按 key 匹配，新增分类无需改索引）
      const counts: Record<string, number> = {};
      for (const item of result.value.items) {
        const g = item.group || 'info';
        counts[g] = (counts[g] || 0) + 1;
      }
      for (const cat of CATEGORIES) {
        if (cat.key !== 'all') cat.count = counts[cat.key] || 0;
      }
    } else {
      ElMessage.warning('暂无检查结果，请先上传文件进行检查');
      router.replace('/upload');
    }
  } catch {
    ElMessage.error('检查结果解析失败');
    router.replace('/upload');
  }
});

// ── 分页 ─────────────────────────────────────────────────
const PAGE_SIZE = 10;
const currentPage = ref(1);

const pagedItems = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE;
  return filteredItems.value.slice(start, start + PAGE_SIZE);
});

// ── 操作 ─────────────────────────────────────────────────
function goBack() {
  router.push('/upload');
}

async function handlePreview() {
  if (!result.value?.招标文件?.jobId) {
    ElMessage.warning('无文件可预览');
    return;
  }
  try {
    previewFile(result.value.招标文件.jobId);
  } catch {
    ElMessage.error('预览失败，请检查服务连接');
  }
}

async function handleExport() {
  if (!result.value?.招标文件?.jobId) {
    ElMessage.warning('无结果可导出');
    return;
  }
  try {
    await downloadCheckResultMarkdown(result.value.招标文件.jobId);
    ElMessage.success('导出成功');
  } catch {
    ElMessage.error('导出失败，请检查服务连接');
  }
}

function handleRowDetail(item: CheckItem) {
  const hasEvidence = item.招标原文 || item.投标原文;
  if (!hasEvidence) {
    ElMessage.info('该检查项无原文依据');
    return;
  }
  const rows: Array<[string, string]> = [];
  if (item.招标原文) rows.push(['招标文件原文', item.招标原文]);
  if (item.招标章节) rows.push(['所在章节', item.招标章节]);
  if (item.投标原文) rows.push(['投标文件原文', item.投标原文]);
  if (item.投标章节) rows.push(['投标章节', item.投标章节]);

  const body = rows
    .map(
      ([k, v]) =>
        `<div style="margin-top:10px;"><div style="font-size:12px;color:#8A8578;margin-bottom:4px;">${escapeHtml(k)}</div><div style="font-size:13px;color:#1F1D1A;line-height:1.7;background:#F7F4EF;border-radius:8px;padding:10px 12px;">${escapeHtml(v)}</div></div>`,
    )
    .join('');

  ElMessageBox.confirm(
    `<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;"><span style="font-weight:600;">${escapeHtml(item.field)}</span><span style="font-size:12px;padding:2px 10px;border-radius:99px;color:#fff;background:${statusColors[item.status]};">${statusLabels[item.status]}</span></div>${body}`,
    '原文依据',
  ).catch(() => {});
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

/** 招标文件原文提示 */
function tipA(item: CheckItem): string {
  if (!item.招标原文) return item.所在页招 || '';
  return `${item.所在页招 ? item.所在页招 + '\n' : ''}${item.招标原文}`;
}

/** 投标文件原文提示 */
function tipB(item: CheckItem): string {
  if (!item.投标原文) return item.投标响应 || '';
  return `${item.所在页投 ? item.所在页投 + '\n' : ''}${item.投标原文}`;
}

function chapterA(item: CheckItem): string {
  return item.招标章节 ? `所在章节：${item.招标章节}` : item.所在页招;
}

function chapterB(item: CheckItem): string {
  return item.投标章节 ? `所在章节：${item.投标章节}` : item.所在页投;
}

const groupLabels: Record<string, string> = {
  info: '项目信息',
  business: '废标项检查',
  tech: '一致性检查',
  score: '遗漏项检查',
  seal: '响应性检查',
  star: '标星条款',
};

const statusLabels: Record<string, string> = {
  pass: '通过',
  warning: '警告',
  risk: '风险',
};

const statusColors: Record<string, string> = {
  pass: '#4E9B7A',
  warning: '#F39C12',
  risk: '#C0392B',
};
</script>

<template>
  <div v-if="result" class="check-view">
    <TopNav title="智能标书解决方案平台-检查" :show-back="true" />

    <div class="check-layout">
      <!-- 左侧分类侧栏 -->
      <aside class="sidebar">
        <div class="sidebar-title">体检分类</div>
        <nav class="category-list">
          <button
            v-for="cat in CATEGORIES"
            :key="cat.key"
            class="category-btn"
            :class="{ active: activeCategory === cat.key }"
            @click="activeCategory = cat.key"
          >
            <span class="accent-bar" :style="{ backgroundColor: cat.color }"></span>
            <span class="cat-label">{{ cat.label }} · {{ cat.count }}</span>
          </button>
        </nav>
        <div class="conclusion-card">
          <div class="conclusion-title">本次体检结论</div>
          <div class="conclusion-row">
            <span>共检查 {{ result.summary.total }} 项，通过 {{ result.summary.pass }} 项</span>
          </div>
          <div v-if="result.summary.risk > 0" class="conclusion-row conclusion-risk">
            <span>发现 {{ result.summary.risk }} 项废标风险，建议立即修正</span>
          </div>
          <div class="conclusion-row conclusion-time">
            <span>{{ result.checkTime }}</span>
          </div>
        </div>
      </aside>

      <!-- 主内容区 -->
      <main class="main-content">
        <!-- 标题行 -->
        <div class="title-row">
          <div class="title-text">{{ activeCategory === 'all' ? '全部检查项明细' : groupLabels[activeCategory] || '检查项明细' }}</div>
          <div class="title-actions">
            <button class="action-btn" @click="handlePreview">
              <RiEyeLine class="icon" />
              预览
            </button>
            <button class="action-btn" @click="handleExport">
              <RiDownload2Line class="icon" />
              导出
            </button>
          </div>
        </div>

        <!-- 统计卡片 -->
        <div class="stat-cards">
          <div class="stat-card stat-pass">
            <span class="stat-num">{{ result.summary.pass }}</span>
            <span class="stat-label">通过项</span>
          </div>
          <div class="stat-card stat-warning">
            <span class="stat-num">{{ result.summary.warning }}</span>
            <span class="stat-label">警告项</span>
          </div>
          <div class="stat-card stat-risk">
            <span class="stat-num">{{ result.summary.risk }}</span>
            <span class="stat-label">风险项</span>
          </div>
        </div>

        <!-- 检查明细表格 -->
        <div class="table-container">
          <table class="check-table">
            <thead>
              <tr>
                <th class="col-field">检查字段</th>
                <th class="col-require">招标文件要求</th>
                <th class="col-page-a">所在页(招)</th>
                <th class="col-page-b">所在页(投)</th>
                <th class="col-response">投标文件响应</th>
                <th class="col-status">状态</th>
                <th class="col-action">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, idx) in pagedItems"
                :key="idx"
                :class="'row-' + item.status"
              >
                <td class="col-field">
                  <span class="field-name">{{ item.field }}</span>
                </td>
                <td class="col-require">
                  <span class="require-text" :class="{ 'has-source': item.招标原文 }" :title="tipA(item)">
                    {{ item.招标要求 || '—' }}
                  </span>
                </td>
                <td class="col-page-a">
                  <span class="page-tag" :class="{ 'has-source': item.招标章节 }" :title="chapterA(item)">{{ item.所在页招 || '—' }}</span>
                </td>
                <td class="col-page-b">
                  <span class="page-tag" :class="{ 'has-source': item.投标章节 }" :title="chapterB(item)">{{ item.所在页投 || '—' }}</span>
                </td>
                <td class="col-response">
                  <span class="response-text" :class="{ 'has-source': item.投标原文 }" :title="tipB(item)">
                    {{ item.投标响应 || '—' }}
                  </span>
                </td>
                <td class="col-status">
                  <span
                    class="status-dot"
                    :style="{ backgroundColor: statusColors[item.status] }"
                  >
                    {{ statusLabels[item.status] }}
                  </span>
                </td>
                <td class="col-action">
                  <button class="detail-btn" @click="handleRowDetail(item)">
                    <RiMore2Line class="icon" />
                  </button>
                </td>
              </tr>
              <tr v-if="pagedItems.length === 0">
                <td colspan="7" class="empty-cell">该分类下无检查项</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 分页 -->
        <Pagination
          :total="filteredItems.length"
          :page-size="PAGE_SIZE"
          :current-page="currentPage"
          @update:current-page="currentPage = $event"
        />

        <div class="back-btn-wrap">
          <button class="back-btn" @click="goBack">
            <RiArrowLeftSLine class="icon" />
            返回重新上传
          </button>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.check-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg-main, #FAF7F2);
}
.check-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* ── 左侧分类侧栏 ──────────────────────────────────────── */
.sidebar {
  width: 300px;
  flex-shrink: 0;
  background: var(--color-bg-white, #FFFFFF);
  border-right: 0.7px solid var(--color-border-soft, #EDE9E0);
  display: flex;
  flex-direction: column;
  padding: 24px 20px;
  gap: 20px;
  overflow-y: auto;
}
.sidebar-title {
  font-size: 15px;
  font-family: "SourceHanSans-Regular", var(--font-family-cn);
  color: var(--color-text-muted, #8A8578);
  padding: 0 12px;
}
.category-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.category-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 52px;
  padding: 0 16px;
  border: none;
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: background 0.2s;
}
.category-btn:hover {
  background: var(--color-bg-secondary, #F7F3EA);
}
.category-btn.active {
  background: var(--color-primary-soft, #FBE9E7);
}
.accent-bar {
  width: 4px;
  height: 18px;
  border-radius: 2px;
  flex-shrink: 0;
}
.cat-label {
  font-size: 16px;
  font-family: "SourceHanSans-Regular", var(--font-family-cn);
  color: var(--color-text-body, #3A3A3A);
  line-height: 1.2;
}
.category-btn.active .cat-label {
  font-weight: 600;
  color: var(--color-primary, #C0392B);
}

/* 体检结论卡片 */
.conclusion-card {
  margin-top: auto;
  background: rgba(251, 247, 238, 1);
  border: 0.7px solid var(--color-border, #E5DFD3);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.conclusion-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary, #1F1D1A);
  font-family: "SourceHanSans-Bold", var(--font-family-cn);
}
.conclusion-row {
  font-size: 14px;
  color: var(--color-text-secondary, #6E6A60);
  font-family: "SourceHanSans-Regular", var(--font-family-cn);
  line-height: 1.5;
}
.conclusion-risk {
  color: var(--color-error, #C0392B);
  font-weight: 500;
}
.conclusion-time {
  font-size: 13px;
  color: var(--color-text-muted, #8A8578);
}

/* ── 主内容区 ──────────────────────────────────────────── */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 24px 32px;
  gap: 20px;
  max-height: calc(100vh - 72px);
}

/* 标题行 */
.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.title-text {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-primary, #1F1D1A);
  font-family: "SourceHanSans-Bold", var(--font-family-cn);
}
.title-actions {
  display: flex;
  gap: 12px;
}
.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 42px;
  padding: 0 16px;
  border: none;
  border-radius: 8px;
  background: var(--color-bg-card, #FCFBF8);
  color: var(--color-text-body, #3A3A3A);
  font-size: 15px;
  cursor: pointer;
  font-family: "SourceHanSans-Regular", var(--font-family-cn);
  transition: all 0.2s;
}
.action-btn:hover {
  background: var(--color-bg-secondary, #F7F3EA);
}
.action-btn .icon {
  font-family: "remixicon", sans-serif;
  font-style: normal;
  font-size: 18px;
}

/* 统计卡片 */
.stat-cards {
  display: flex;
  gap: 16px;
}
.stat-card {
  flex: 1;
  height: 80px;
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  border: 0.7px solid transparent;
}
.stat-pass {
  background: rgba(228, 240, 234, 1);
  border-color: rgba(205, 227, 217, 1);
}
.stat-warning {
  background: rgba(253, 246, 227, 1);
  border-color: rgba(239, 224, 190, 1);
}
.stat-risk {
  background: rgba(251, 233, 231, 1);
  border-color: rgba(239, 207, 202, 1);
}
.stat-num {
  font-size: 30px;
  font-weight: 700;
  line-height: 1;
  font-family: "SourceHanSans-Bold", var(--font-family-cn);
}
.stat-pass .stat-num { color: var(--color-success, #4E9B7A); }
.stat-warning .stat-num { color: var(--color-warning, #F39C12); }
.stat-risk .stat-num { color: var(--color-error, #C0392B); }
.stat-label {
  font-size: 16px;
  color: var(--color-text-secondary, #6E6A60);
  font-family: "SourceHanSans-Regular", var(--font-family-cn);
}

/* 检查明细表格 */
.table-container {
  flex: 1;
  background: var(--color-bg-white, #FFFFFF);
  border: 0.7px solid var(--color-border-soft, #EDE9E0);
  border-radius: 16px;
  overflow: auto;
}
.check-table {
  width: 100%;
  border-collapse: collapse;
}
.check-table thead {
  position: sticky;
  top: 0;
  z-index: 1;
}
.check-table th {
  text-align: left;
  font-size: 15px;
  font-weight: 400;
  color: var(--color-text-secondary, #6E6A60);
  padding: 0 20px;
  height: 54px;
  background: var(--color-bg-secondary, #F7F3EA);
  border-bottom: 0.7px solid var(--color-border, #E5DFD3);
  font-family: "SourceHanSans-Regular", var(--font-family-cn);
  white-space: nowrap;
}
.check-table td {
  padding: 0 20px;
  height: 76px;
  vertical-align: middle;
  border-bottom: 0.7px solid var(--color-border-soft, #EDE9E0);
  font-size: 14px;
  color: var(--color-text-body, #3A3A3A);
  font-family: "SourceHanSans-Regular", var(--font-family-cn);
}
.check-table tbody tr:hover td {
  background: var(--color-bg-card, #FCFBF8);
}
.check-table tbody tr.row-warning td {
  background: rgba(253, 246, 227, 0.5);
}
.check-table tbody tr.row-risk td {
  background: rgba(251, 233, 231, 0.5);
}

.col-field { width: 230px; }
.col-require { flex: 1; }
.col-page-a { width: 100px; }
.col-page-b { width: 100px; }
.col-response { flex: 1; }
.col-status { width: 80px; }
.col-action { width: 80px; }

.field-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary, #1F1D1A);
  font-family: "SourceHanSans-Medium", var(--font-family-cn);
}
.require-text {
  font-size: 14px;
  color: var(--color-text-body, #3A3A3A);
  line-height: 1.5;
  display: block;
}
/* 有原文依据时提示可悬停查看 */
.has-source {
  cursor: help;
  border-bottom: 1px dashed var(--color-border, #E5DFD3);
}
.page-tag {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 13px;
  background: var(--color-bg-secondary, #F7F3EA);
  color: var(--color-text-secondary, #6E6A60);
  font-family: "SourceHanSans-Regular", var(--font-family-cn);
}
.response-text {
  font-size: 14px;
  color: var(--color-text-body, #3A3A3A);
  line-height: 1.5;
  display: block;
}
.status-dot {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 500;
  font-family: "SourceHanSans-Medium", var(--font-family-cn);
}
.status-dot::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.detail-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted, #8A8578);
  transition: background 0.2s, color 0.2s;
}
.detail-btn:hover {
  background: var(--color-bg-secondary, #F7F3EA);
  color: var(--color-text-body, #3A3A3A);
}
.detail-btn .icon {
  font-family: "remixicon", sans-serif;
  font-style: normal;
  font-size: 18px;
}
.empty-cell {
  text-align: center;
  color: var(--color-text-faint, #A7A296);
  font-size: 14px;
  padding: 48px 0 !important;
}

/* 返回按钮 */
.back-btn-wrap {
  display: flex;
  justify-content: center;
  padding-top: 8px;
}
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 24px;
  height: 46px;
  border: 0.7px solid var(--color-border, #E5DFD3);
  border-radius: 12px;
  background: var(--color-bg-white, #fff);
  font-size: 15px;
  color: var(--color-text-body, #3A3A3A);
  cursor: pointer;
  font-family: "SourceHanSans-Medium", var(--font-family-cn);
  transition: all 0.2s;
}
.back-btn:hover {
  background: var(--color-bg-secondary, #F7F3EA);
}
.back-btn .icon {
  font-family: "remixicon", sans-serif;
  font-style: normal;
  font-size: 18px;
}
</style>
