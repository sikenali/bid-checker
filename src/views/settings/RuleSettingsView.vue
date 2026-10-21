<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from '@/utils/toast';
import apiClient from '@/api/client';
import { UiSwitch, UiInput, UiTip } from '@/components/ui';
import RuleDialog from '@/components/settings/RuleDialog.vue';

interface ExtractionRule {
  id: string;
  fieldName: string;
  pattern: string;
  enabled: boolean;
  category: string;
  groupName: string;
  aliasFor?: string;
}

const GROUPS = [
  { key: 'info', label: '项目信息' },
  { key: 'business', label: '商务条款' },
  { key: 'tech', label: '技术条款' },
  { key: 'score', label: '评分标准' },
  { key: 'seal', label: '封标信息' },
  { key: 'star', label: '标星条款' },
];

const rules = ref<ExtractionRule[]>([]);
const loading = ref(false);
const activeGroup = ref('all');
const searchQuery = ref('');

// ── 新增/编辑弹窗 ─────────────────────────────────────────
const showAddDialog = ref(false);
const addMode = ref<'regex' | 'keyword'>('regex');
const showEditDialog = ref(false);
const editingRule = ref<ExtractionRule | null>(null);
const editMode = ref<'regex' | 'keyword'>('regex');
const showDeleteDialog = ref(false);
const deletingId = ref('');

async function loadRules() {
  loading.value = true;
  try {
    const res: any = await apiClient.get('/rules');
    rules.value = ((res.data || []) as any[]).map((r: any) => ({
      id: r.id,
      fieldName: r.fieldName,
      pattern: r.pattern,
      enabled: r.enabled === 1 || r.enabled === true,
      category: r.category || '',
      groupName: r.groupName || 'info',
      aliasFor: r.aliasFor || '',
    }));
  } catch {
    rules.value = [];
    ElMessage.error('规则加载失败，请检查后端服务');
  } finally {
    loading.value = false;
  }
}

const filteredRules = computed(() => {
  let list = rules.value;
  if (activeGroup.value !== 'all') {
    list = list.filter(r => r.groupName === activeGroup.value);
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase();
    list = list.filter(r => r.fieldName.toLowerCase().includes(q));
  }
  return list;
});

async function toggleEnabled(rule: ExtractionRule) {
  const next = !rule.enabled;
  rule.enabled = next;
  try {
    await apiClient.put(`/rules/${rule.id}`, { enabled: next ? 1 : 0 });
    ElMessage.success(next ? `已启用「${rule.fieldName}」` : `已停用「${rule.fieldName}」`);
  } catch {
    rule.enabled = !next;
    ElMessage.error('操作失败');
  }
}

async function handleReset() {
  try {
    const res: any = await apiClient.post('/rules/universal');
    await loadRules();
    ElMessage.success(res.data?.total ? `已恢复通用规则，共 ${res.data.total} 条` : '已恢复通用规则');
  } catch {
    ElMessage.error('恢复失败');
  }
}

// ── 新增规则 ──────────────────────────────────────────────
function openAdd(mode: 'regex' | 'keyword') {
  addMode.value = mode;
  showAddDialog.value = true;
}

async function handleAddSubmit(data: { fieldName: string; pattern: string; category: string; groupName: string; aliasFor: string }) {
  try {
    const payload: any = {
      fieldName: data.fieldName,
      pattern: data.pattern || '.*' + data.fieldName + '.*',
      category: data.category,
      groupName: data.groupName,
    };
    if (data.aliasFor) payload.aliasFor = data.aliasFor;
    await apiClient.post('/rules', payload);
    showAddDialog.value = false;
    ElMessage.success(`已新增规则「${data.fieldName}」`);
    await loadRules();
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.error || '新增失败');
  }
}

// ── 编辑规则 ──────────────────────────────────────────────
function openEdit(rule: ExtractionRule) {
  editingRule.value = rule;
  editMode.value = (rule.category as 'regex' | 'keyword') || 'regex';
  showEditDialog.value = true;
}

async function handleEditSubmit(data: { fieldName: string; pattern: string; category: string; groupName: string; aliasFor: string }) {
  if (!editingRule.value) return;
  try {
    const payload: any = {
      fieldName: data.fieldName,
      pattern: data.pattern || '.*' + data.fieldName + '.*',
      category: data.category,
      groupName: data.groupName,
    };
    if (data.aliasFor) payload.aliasFor = data.aliasFor;
    await apiClient.put(`/rules/${editingRule.value.id}`, payload);
    showEditDialog.value = false;
    ElMessage.success(`已更新规则「${data.fieldName}」`);
    await loadRules();
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.error || '更新失败');
  }
}

// ── 删除规则 ──────────────────────────────────────────────
async function openDelete(id: string) {
  deletingId.value = id;
  showDeleteDialog.value = true;
}

async function confirmDelete() {
  if (!deletingId.value) return;
  try {
    await apiClient.delete(`/rules/${deletingId.value}`);
    showDeleteDialog.value = false;
    ElMessage.success('已删除');
    await loadRules();
  } catch {
    ElMessage.error('删除失败');
  }
}

const categoryBadge = (cat: string) => {
  if (cat === 'keyword') return { label: '关键字', icon: 'ri-price-tag-line' };
  return { label: '正则', icon: 'ri-code-s-slash-line' };
};

onMounted(loadRules);
</script>

<template>
  <div class="rule-view">
    <div class="page-header-card">
      <div class="header-content">
        <div class="header-info">
          <div class="breadcrumb">
            <span>首页</span>
            <span class="sep">/</span>
            <span>设置中心</span>
            <span class="sep">/</span>
            <span class="current">规则管理</span>
          </div>
          <div class="header-title">
            <h1>规则管理</h1>
            <p>配置字段抽取规则（正则 / 关键字），支持分组管理与启停</p>
          </div>
        </div>
        <div class="header-actions">
          <UiInput v-model="searchQuery" placeholder="搜索字段名" size="sm" prefix-icon="ri-search-line" clearable style="width:200px" />
          <button class="add-btn" @click="openAdd('regex')">
            <RiAddLine class="icon" />
            新增规则
          </button>
          <button class="add-btn keyword" @click="openAdd('keyword')">
            <RiAddLine class="icon" />
            新增关键字
          </button>
          <button class="reset-button" @click="handleReset">
            <RiRestartLine class="icon" />
            恢复通用规则
          </button>
        </div>
      </div>
    </div>

    <div class="group-tabs">
      <button
        class="group-tab"
        :class="{ active: activeGroup === 'all' }"
        @click="activeGroup = 'all'"
      >
        全部
      </button>
      <button
        v-for="g in GROUPS"
        :key="g.key"
        class="group-tab"
        :class="{ active: activeGroup === g.key }"
        @click="activeGroup = g.key"
      >
        {{ g.label }}
      </button>
    </div>

    <div class="section-card">
      <div v-if="loading" class="empty-state">
        <span class="loading-text">加载中…</span>
      </div>
      <div v-else-if="filteredRules.length === 0" class="empty-state">
        <RiFileListLine class="empty-icon" />
        <p class="empty-text">该分组下暂无规则</p>
      </div>
      <div v-else class="rule-table">
        <div class="rule-row rule-row-head">
          <span class="col-field">字段名</span>
          <span class="col-pattern">匹配规则</span>
          <span class="col-category">类别</span>
          <span class="col-group">分组</span>
          <span class="col-toggle">启用</span>
          <span class="col-action">操作</span>
        </div>
        <div
          v-for="rule in filteredRules"
          :key="rule.id"
          class="rule-row"
        >
          <span class="col-field">{{ rule.fieldName }}</span>
          <span class="col-pattern">
            <UiTip :text="rule.pattern" placement="top">
              <code class="pattern-code">{{ rule.pattern }}</code>
            </UiTip>
          </span>
          <span class="col-category">
            <span class="cat-badge">
              <component :is="categoryBadge(rule.category).icon" class="cat-icon" :size="12" />
              {{ categoryBadge(rule.category).label }}
            </span>
          </span>
          <span class="col-group">{{ GROUPS.find(g => g.key === rule.groupName)?.label || rule.groupName }}</span>
          <span class="col-toggle">
            <UiSwitch :model-value="rule.enabled" size="sm" @click="toggleEnabled(rule)" />
          </span>
          <span class="col-action">
            <button class="action-btn edit" @click="openEdit(rule)">
              <RiEditLine class="icon" />
            </button>
            <button class="action-btn delete" @click="openDelete(rule.id)">
              <RiDeleteBinLine class="icon" />
            </button>
          </span>
        </div>
      </div>
    </div>
    <!-- 新增规则弹窗 -->
    <RuleDialog
      v-if="showAddDialog"
      :visible="showAddDialog"
      :mode="addMode"
      @close="showAddDialog = false"
      @submit="handleAddSubmit"
    />

    <!-- 编辑规则弹窗 -->
    <RuleDialog
      v-if="showEditDialog"
      :visible="showEditDialog"
      :mode="editMode"
      :edit-rule="editingRule"
      @close="showEditDialog = false"
      @submit="handleEditSubmit"
    />

    <!-- 删除规则确认弹窗 -->
    <UiModal
      v-model="showDeleteDialog"
      title="删除规则"
      subtitle="删除后该规则将不再用于抽取"
      icon="ri-delete-bin-line"
      :width="480"
      confirm-text="确认删除"
      @confirm="confirmDelete"
    >
      <p class="confirm-text">确定删除该规则？此操作不可恢复。</p>
    </UiModal>
  </div>
</template>

<style scoped>
.rule-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 1400px;
}
.page-header-card {
  background-color: var(--color-bg-white, #FFFFFF);
  border: 0.7px solid var(--color-border-soft, #EDE9E0);
  border-radius: 16px;
  padding: 20px 24px;
}
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
}
.header-info { flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.breadcrumb { display: flex; align-items: center; gap: 8px; font-size: 14px; font-family: "SourceHanSans-Regular", var(--font-family-cn); }
.breadcrumb span { color: var(--color-text-faint, #A7A296); }
.breadcrumb span.current { color: var(--color-text-body, #3A3A3A); font-weight: 500; }
.header-title h1 { font-size: 30px; font-weight: 700; color: var(--color-text-primary, #1F1D1A); margin: 12px 0 0 0; letter-spacing: -0.5px; font-family: "SourceHanSans-Bold", var(--font-family-cn); line-height: 1.2; }
.header-title p { font-size: 15px; color: var(--color-text-secondary, #6E6A60); margin: 8px 0 0 0; font-family: "SourceHanSans-Regular", var(--font-family-cn); }
.header-actions { display: flex; gap: 12px; align-items: center; flex-shrink: 0; }
.reset-button {
  display: inline-flex; align-items: center; gap: 8px; padding: 0 16px; height: 36px;
  border: 0.7px solid var(--color-border, #E5DFD3); background-color: var(--color-bg-white, #FFFFFF); border-radius: 10px;
  font-size: 14px; color: var(--color-text-body, #3A3A3A); cursor: pointer; transition: background 0.2s;
  font-family: "SourceHanSans-Regular", var(--font-family-cn);
}
.reset-button:hover { background: var(--color-bg-secondary, #F7F3EA); }
.reset-button .icon { font-size: 16px; }

.group-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.group-tab {
  height: 36px;
  padding: 0 16px;
  border: 0.7px solid var(--color-border-soft, #EDE9E0);
  background: var(--color-bg-white, #FFFFFF);
  border-radius: 9999px;
  font-size: 14px;
  color: var(--color-text-secondary, #6E6A60);
  cursor: pointer;
  font-family: "SourceHanSans-Regular", var(--font-family-cn);
  transition: all 0.2s;
}
.group-tab:hover { border-color: var(--color-border-hover, #D9D2C2); }
.group-tab.active {
  background: var(--color-primary-soft, #FBE9E7);
  border-color: var(--color-primary, #C0392B);
  color: var(--color-primary, #C0392B);
  font-weight: 500;
}

.section-card {
  background-color: var(--color-bg-white, #FFFFFF);
  border: 0.7px solid var(--color-border-soft, #EDE9E0);
  border-radius: 16px;
  padding: 8px 24px 24px;
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 80px 0;
  color: var(--color-text-muted, #8A8578);
  font-family: "SourceHanSans-Regular", var(--font-family-cn);
}
.empty-icon { color: var(--color-text-faint, #A7A296); }
.empty-text { font-size: 15px; margin: 0; color: var(--color-text-secondary, #6E6A60); }
.loading-text { font-size: 14px; }

.rule-table { display: flex; flex-direction: column; }
.rule-row {
  display: grid;
  grid-template-columns: 1.2fr 2fr 0.8fr 0.8fr 80px 120px;
  gap: 12px;
  align-items: center;
  padding: 12px 8px;
  border-bottom: 0.7px solid var(--color-border-soft, #EDE9E0);
  font-size: 14px;
  color: var(--color-text-body, #3A3A3A);
  font-family: "SourceHanSans-Regular", var(--font-family-cn);
}
.rule-row:last-child { border-bottom: none; }
.rule-row-head {
  color: var(--color-text-secondary, #6E6A60);
  font-size: 13px;
  font-weight: 500;
  padding: 8px;
  border-bottom: 0.7px solid var(--color-border, #E5DFD3);
}
.col-field { font-weight: 500; color: var(--color-text-primary, #1F1D1A); }
.col-pattern { overflow: hidden; text-overflow: ellipsis; }
.pattern-code {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
  background: var(--color-bg-secondary, #F7F3EA);
  border: 0.7px solid var(--color-border-soft, #EDE9E0);
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 12px;
  font-family: var(--font-family-mono, ui-monospace, 'Courier New', monospace);
  color: var(--color-text-body, #3A3A3A);
}
.cat-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  background: var(--color-primary-soft, #FBE9E7);
  color: var(--color-primary, #C0392B);
  border-radius: 9999px;
  font-size: 12px;
}
.cat-icon { display: inline-flex; }
.col-group { color: var(--color-text-secondary, #6E6A60); }
.col-toggle { display: flex; justify-content: flex-end; }
.col-action { display: flex; justify-content: flex-end; gap: 8px; }
.action-btn {
  width: 32px;
  height: 32px;
  border: 0.7px solid var(--color-border-soft, #EDE9E0);
  border-radius: 8px;
  background: var(--color-bg-white, #fff);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.action-btn .icon {
  font-family: "remixicon", sans-serif;
  font-style: normal;
  font-size: 14px;
}
.action-btn.edit { color: var(--color-info, #4A72A8); }
.action-btn.edit:hover { background: rgba(74, 114, 168, 0.08); border-color: var(--color-info, #4A72A8); }
.action-btn.delete { color: var(--color-error, #E74C3C); }
.action-btn.delete:hover { background: rgba(231, 76, 60, 0.08); border-color: var(--color-error, #E74C3C); }

/* 新增按钮 */
.add-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  height: 36px;
  border: none;
  border-radius: 10px;
  background: var(--color-primary, #C0392B);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  font-family: "SourceHanSans-Medium", var(--font-family-cn);
  transition: background 0.2s;
}
.add-btn:hover { background: color-mix(in srgb, var(--color-primary, #C0392B) 88%, black); }
.add-btn .icon { font-size: 16px; }
.add-btn.keyword { background: var(--color-info, #4A72A8); }
.add-btn.keyword:hover { background: color-mix(in srgb, var(--color-info, #4A72A8) 88%, black); }

/* 确认弹窗正文 */
.confirm-text {
  font-size: 15px;
  color: var(--color-text-body, #3A3A3A);
  font-family: "SourceHanSans-Regular", var(--font-family-cn);
  margin: 0;
  line-height: 1.7;
}
</style>
