<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import TopNav from '@/components/layout/TopNav.vue';
import PageFooter from '@/components/layout/PageFooter.vue';
import UploadCard from '@/components/upload/UploadCard.vue';
import CreditQualificationModal from '@/components/layout/CreditQualificationModal.vue';
import BiddingSitesModal from '@/components/layout/BiddingSitesModal.vue';
import { ElMessage } from '@/utils/toast';
import { getCheckConfig, runCheck, buildCheckResult } from '@/api/check';
import { getParseStatus } from '@/api/upload';

const router = useRouter();
const showCreditModal = ref(false);
const showBiddingModal = ref(false);

// ── 文件引用 ─────────────────────────────────────────────
const fileA = ref<File | null>(null);
const fileB = ref<File | null>(null);
const jobIdA = ref('');
const jobIdB = ref('');

// ── 检查状态 ─────────────────────────────────────────────
const checking = ref(false);
const checkProgress = ref('');

// ── LLM 配置 ─────────────────────────────────────────────
const hasLlmSkill = ref(false);
const llmSkillName = ref('');
const defaultSkillId = ref('');

onMounted(async () => {
  try {
    const config = await getCheckConfig();
    hasLlmSkill.value = config.hasLlmSkill;
    llmSkillName.value = config.skillName || '';
    defaultSkillId.value = config.defaultSkillId || '';
  } catch {
    hasLlmSkill.value = false;
  }
});

function handleSuccessA(jobId: string, file: File) {
  jobIdA.value = jobId;
  fileA.value = file;
  ElMessage.success('招标文件上传成功');
}

function handleSuccessB(jobId: string, file: File) {
  jobIdB.value = jobId;
  fileB.value = file;
  ElMessage.success('投标文件上传成功');
}

function handleReplaceA() {
  fileA.value = null;
  jobIdA.value = '';
  ElMessage.info('已清除文件，请重新选择');
}

function handleReplaceB() {
  fileB.value = null;
  jobIdB.value = '';
  ElMessage.info('已清除文件，请重新选择');
}

async function handleCheck() {
  if (!fileA.value || !fileB.value) {
    ElMessage.warning('请分别上传招标文件和投标文件后再检查');
    return;
  }

  checking.value = true;
  checkProgress.value = '正在解析招标文件…';

  try {
    // 根据是否配置 LLM 模型选择上传方式
    const skillId = hasLlmSkill.value ? defaultSkillId.value : undefined;

    const { jobIdA: newJobIdA, jobIdB: newJobIdB, mode } = await runCheck(
      fileA.value,
      fileB.value,
      skillId,
    );

    jobIdA.value = newJobIdA;
    jobIdB.value = newJobIdB;

    checkProgress.value = '正在获取提取结果…';

    // 获取两个文件的提取结果
    const [resA, resB] = await Promise.all([
      getParseStatus(newJobIdA),
      getParseStatus(newJobIdB),
    ]);

    checkProgress.value = '正在对比差异…';

    const result = buildCheckResult(resA.result, resB.result, fileA.value.name, fileB.value.name, mode);
    // 将 jobId 存入结果，供检查页导出/预览使用
    result.招标文件.jobId = newJobIdA;
    result.投标文件.jobId = newJobIdB;
    sessionStorage.setItem('bidchecker.checkResult', JSON.stringify(result));
    router.push({ path: '/check-result' });
  } catch (err: any) {
    const msg = err?.response?.data?.error || err?.message || '检查失败，请重试';
    ElMessage.error(msg);
  } finally {
    checking.value = false;
    checkProgress.value = '';
  }
}

// 从 sessionStorage 读取结果并传给 CheckResultView
const checkResult = ref<any>(null);
onMounted(() => {
  try {
    const raw = sessionStorage.getItem('bidchecker.checkResult');
    if (raw) checkResult.value = JSON.parse(raw);
  } catch {}
});
</script>

<template>
  <div class="upload-view">
    <TopNav title="智能标书解决方案平台-检查" :show-back="false" />

    <div class="upload-body">
      <div class="upload-row">
        <div class="upload-col">
          <p class="upload-label">招标文件（对照依据）</p>
          <UploadCard
            title="上传招标文件（docx/pdf/md/txt/xlsx/csv/html）"
            @success="handleSuccessA"
            @replace="handleReplaceA"
          />
        </div>
        <div class="upload-col">
          <p class="upload-label">投标文件（待检查文件）</p>
          <UploadCard
            title="上传投标文件（docx/pdf/md/txt/xlsx/csv/html）"
            @success="handleSuccessB"
            @replace="handleReplaceB"
          />
        </div>
      </div>

      <!-- 检查模式提示 -->
      <div v-if="hasLlmSkill" class="mode-hint">
        <RiBrainLine class="hint-icon" />
        <span>将使用 LLM 智能增强提取（{{ llmSkillName }}）</span>
      </div>
      <div v-else class="mode-hint mode-hint--fallback">
        <RiSettings3Line class="hint-icon" />
        <span>未配置 LLM 模型，将使用 OfficeParser 规则提取</span>
      </div>

      <!-- 检查按钮 -->
      <div class="check-btn-wrap">
        <button
          class="check-btn"
          :class="{ 'is-checking': checking }"
          :disabled="checking"
          @click="handleCheck"
        >
          <RiLoader4Line v-if="checking" class="btn-icon spinning" />
          <RiFileCheckLine v-else class="btn-icon" />
          {{ checking ? '检查中…' : '开始智能检查' }}
        </button>
      </div>

      <!-- 进度提示 -->
      <div v-if="checkProgress" class="progress-tip">
        <RiLoader4Line class="spinning" />
        <span>{{ checkProgress }}</span>
      </div>
    </div>

    <PageFooter @credit-query="showCreditModal = true" @bidding-sites="showBiddingModal = true" />

    <CreditQualificationModal v-model:visible="showCreditModal" />
    <BiddingSitesModal v-model:visible="showBiddingModal" />
  </div>
</template>

<style scoped>
.upload-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg-main, #FAF7F2);
}
.upload-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 32px;
  gap: 24px;
}
.upload-row {
  display: flex;
  gap: 48px;
  align-items: flex-start;
  flex-wrap: wrap;
  justify-content: center;
}
.upload-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: min(875px, calc(100vw - 64px));
}
.upload-label {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary, #1F1D1A);
  font-family: "SourceHanSans-Medium", var(--font-family-cn);
  margin: 0;
}

/* 模式提示 */
.mode-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 10px;
  background: var(--color-bg-white, #fff);
  border: 0.7px solid var(--color-border-soft, #EDE9E0);
  font-size: 14px;
  color: var(--color-text-secondary, #6E6A60);
  font-family: "SourceHanSans-Regular", var(--font-family-cn);
}
.mode-hint .hint-icon {
  font-family: "remixicon", sans-serif;
  font-style: normal;
  font-size: 18px;
  color: var(--color-info, #4A72A8);
}
.mode-hint--fallback .hint-icon {
  color: var(--color-text-muted, #8A8578);
}

/* 检查按钮 */
.check-btn-wrap {
  display: flex;
  justify-content: center;
  padding-top: 8px;
}
.check-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 56px;
  padding: 0 48px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--color-primary, #C0392B) 0%, #a83228 100%);
  color: #fff;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  font-family: "SourceHanSans-Medium", var(--font-family-cn);
  transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
  box-shadow: 0 4px 16px color-mix(in srgb, var(--color-primary, #C0392B) 30%, transparent);
}
.check-btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px color-mix(in srgb, var(--color-primary, #C0392B) 35%, transparent);
}
.check-btn:active:not(:disabled) {
  transform: translateY(0);
}
.check-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.check-btn.is-checking {
  background: var(--color-text-muted, #8A8578);
}
.btn-icon {
  font-family: "remixicon", sans-serif;
  font-style: normal;
  font-size: 22px;
}
.spinning {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 进度提示 */
.progress-tip {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--color-text-secondary, #6E6A60);
  font-family: "SourceHanSans-Regular", var(--font-family-cn);
}
.progress-tip .ri-loader-4-line {
  font-family: "remixicon", sans-serif;
  font-style: normal;
  font-size: 18px;
  color: var(--color-primary, #C0392B);
}
</style>
