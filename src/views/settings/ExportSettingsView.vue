<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { ElMessage } from '@/utils/toast';
import { getExportSettings, setExportSettings } from '@/api/settings';
import { UiSwitch, UiSelectCard } from '@/components/ui';

interface ExportItem {
  key: string;
  name: string;
  desc: string;
  iconText: string;
  iconColor: string;
}

const formats: ExportItem[] = [
  { key: 'markdown', name: 'Markdown ·.md', desc: '轻盈纯文本，便于二次编辑与粘贴至团队 Wiki', iconText: 'MD', iconColor: '#3A4A63' },
  { key: 'json', name: 'JSON 数据 ·.json', desc: '结构化原始数据，便于程序处理与二次开发', iconText: '{}', iconColor: '#4E9B7A' },
];

const mdSettings = ref({
  preserveTable: true,
  downgradeTitle: false,
});

const selectedFormat = ref('markdown');

let ready = false;
const num = (v: boolean) => (v ? 1 : 0);

async function persist() {
  if (!ready) return;
  try {
    await setExportSettings({
      format: selectedFormat.value,
      md_keep_tables: num(mdSettings.value.preserveTable),
      md_demote_heading: num(mdSettings.value.downgradeTitle),
    });
  } catch {
    ElMessage.error('保存导出设置失败');
  }
}

function applyLoaded(s: Record<string, any>) {
  selectedFormat.value = s.format || 'markdown';
  mdSettings.value = {
    preserveTable: (s.md_keep_tables ?? 1) === 1,
    downgradeTitle: (s.md_demote_heading ?? 0) === 1,
  };
}

onMounted(async () => {
  try {
    applyLoaded(await getExportSettings());
  } catch {
    ElMessage.warning('后端服务不可用，导出设置暂用本地默认');
  } finally {
    ready = true;
  }
});

watch([selectedFormat, mdSettings], persist, { deep: true });

async function resetAll() {
  applyLoaded({
    format: 'markdown',
    md_keep_tables: 1,
    md_demote_heading: 0,
  });
  ready = true;
  await persist();
  ElMessage.success('已恢复默认导出设置');
}
</script>

<template>
  <div class="export-view">
    <!-- 页面头部卡片 -->
    <div class="page-header-card">
      <div class="header-content">
        <div class="header-info">
          <div class="breadcrumb">
            <span>首页</span>
            <span class="sep">/</span>
            <span>设置中心</span>
            <span class="sep">/</span>
            <span class="current">导出管理</span>
          </div>
          <div class="header-title">
            <h1>导出管理</h1>
            <p>配置导出格式与输出规格，检查完成后点击下载结果</p>
          </div>
        </div>
        <button class="reset-button" @click="resetAll">
          <RiRestartLine class="icon" />
          恢复默认
        </button>
      </div>
    </div>

    <!-- 默认导出格式 -->
    <div class="section-card">
      <div class="card-title">默认导出格式</div>
      <div class="format-group">
        <div v-for="fmt in formats" :key="fmt.key" class="format-cell">
          <UiSelectCard
            :selected="selectedFormat === fmt.key"
            :title="fmt.name"
            :desc="fmt.desc"
            :icon-text="fmt.iconText"
            :icon-color="fmt.iconColor"
            @select="selectedFormat = fmt.key"
          />
        </div>
      </div>
    </div>

    <!-- Markdown 导出设置 -->
    <div v-if="selectedFormat === 'markdown'" class="section-card">
      <div class="card-title">Markdown 导出设置</div>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-name">保留表格与图片链接</div>
          <div class="setting-desc">表格转为 Markdown 语法，图片保留相对路径</div>
        </div>
        <UiSwitch v-model="mdSettings.preserveTable" />
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-name">一级标题自动降级</div>
          <div class="setting-desc">便于直接粘贴到团队 Wiki 的文档树中</div>
        </div>
        <UiSwitch v-model="mdSettings.downgradeTitle" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.export-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1620px;
}

/* 页面头部卡片 */
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
.header-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.breadcrumb { display: flex; align-items: center; gap: 8px; font-size: 14px; font-family: "SourceHanSans-Regular", var(--font-family-cn); }
.breadcrumb span { color: var(--color-text-faint, #A7A296); }
.breadcrumb span.sep { color: var(--color-text-faint, #A7A296); }
.breadcrumb span.current { color: var(--color-text-body, #3A3A3A); font-weight: 500; }
.header-title h1 { font-size: 30px; font-weight: 700; color: var(--color-text-primary, #1F1D1A); margin: 12px 0 0 0; letter-spacing: -0.5px; font-family: "SourceHanSans-Bold", var(--font-family-cn); line-height: 1.2; }
.header-title p { font-size: 15px; color: var(--color-text-secondary, #6E6A60); margin: 8px 0 0 0; font-family: "SourceHanSans-Regular", var(--font-family-cn); }
.reset-button {
  display: inline-flex; align-items: center; gap: 8px; padding: 0 20px; height: 48px;
  border: 0.7px solid var(--color-border, #E5DFD3); background-color: var(--color-bg-white, #FFFFFF); border-radius: 12px;
  font-size: 15px; color: var(--color-text-body, #3A3A3A); cursor: pointer; transition: all 0.2s; flex-shrink: 0;
  font-family: "SourceHanSans-Regular", var(--font-family-cn);
}
.reset-button:hover { background-color: var(--color-bg-secondary, #F7F3EA); }
.reset-button .icon { font-family: "remixicon", sans-serif; font-style: normal; font-size: 18px; }

/* 通用卡片 */
.section-card {
  background-color: var(--color-bg-white, #FFFFFF);
  border: 0.7px solid var(--color-border-soft, #EDE9E0);
  border-radius: 16px;
  padding: 24px 40px;
}
.card-title {
  font-size: 17px;
  font-weight: 500;
  color: var(--color-text-primary, #1F1D1A);
  font-family: "SourceHanSans-Medium", var(--font-family-cn);
}

/* 默认导出格式 */
.format-group {
  display: flex;
  gap: 24px;
  margin-top: 20px;
  align-items: stretch;
}
.format-cell { flex: 1; display: flex; }
.format-cell > * { flex: 1; }

/* 设置项 */
.setting-item {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  height: 76px;
  gap: 20px;
}
.setting-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}
.setting-name {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text-primary, #1F1D1A);
  font-family: "SourceHanSans-Medium", var(--font-family-cn);
}
.setting-desc {
  font-size: 15px;
  color: var(--color-text-muted, #8A8578);
  font-family: "SourceHanSans-Regular", var(--font-family-cn);
}
</style>
