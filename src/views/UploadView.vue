<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import TopNav from '@/components/layout/TopNav.vue';
import PageFooter from '@/components/layout/PageFooter.vue';
import UploadCard, { type FileInfo } from '@/components/upload/UploadCard.vue';
import StepStrip from '@/components/StepStrip.vue';
import CreditQualificationModal from '@/components/layout/CreditQualificationModal.vue';
import BiddingSitesModal from '@/components/layout/BiddingSitesModal.vue';
import { runCheck, buildCheckResult } from '@/api/check';

const router = useRouter();
const showCreditModal = ref(false);
const showBiddingModal = ref(false);

// ── 文件信息（仅本地选择，上传由 StepStrip 按钮统一触发）─────────
const leftFileInfo = ref<FileInfo>({ file: null, name: '', size: '', type: '' });
const rightFileInfo = ref<FileInfo>({ file: null, name: '', size: '', type: '' });

const bothReady = computed(() => !!leftFileInfo.value.file && !!rightFileInfo.value.file);

// ── 检查状态 ─────────────────────────────────────────────
const checking = ref(false);
const checkError = ref('');

// StepStrip 动画完成回调
let stepStripResolve: (() => void) | null = null;
let stepStripDone = false;
function onStepStripFinished() {
  stepStripDone = true;
  if (stepStripResolve) {
    stepStripResolve();
    stepStripResolve = null;
  }
}
function waitStepStrip(): Promise<void> {
  if (stepStripDone) return Promise.resolve();
  return new Promise<void>(resolve => {
    stepStripResolve = resolve;
  });
}

const steps = [
  { key: 0, label: '解析文件' },
  { key: 1, label: '提取文件' },
  { key: 2, label: '校验对比' },
];

// ── 开始智能检查：是否走 LLM 增强由后端判定 ──────────────────────
// 前端不再读取技能列表、不传 skill_id；后端若已配置模型与启用技能则自动智能增强
async function handleCheck() {
  if (!leftFileInfo.value.file || !rightFileInfo.value.file || checking.value) return;

  checking.value = true;
  stepStripDone = false;
  checkError.value = '';

  try {
    const { jobIdA, jobIdB, mode, resultA, resultB } = await runCheck(
      leftFileInfo.value.file,
      rightFileInfo.value.file,
    );

    const result = buildCheckResult(
      resultA,
      resultB,
      leftFileInfo.value.name,
      rightFileInfo.value.name,
      mode,
    );
    result.招标文件.jobId = jobIdA;
    result.投标文件.jobId = jobIdB;
    sessionStorage.setItem('bidchecker.checkResult', JSON.stringify(result));

    await waitStepStrip();
    router.push({ path: '/check-result' });
  } catch (err: any) {
    checkError.value = err?.response?.data?.error || err?.message || '检查失败，请重试';
  } finally {
    checking.value = false;
  }
}

function handleReplace() {}
</script>

<template>
  <div class="upload-view">
    <TopNav title="智能标书解决方案平台-检查" :show-back="false" />

    <div class="upload-body">
      <div class="upload-area">
        <UploadCard
          v-model:leftFileInfo="leftFileInfo"
          v-model:rightFileInfo="rightFileInfo"
          :disabled="checking"
          @replace="handleReplace"
        />

        <StepStrip
          :steps="steps"
          :loading="checking"
          button-label="一键检查"
          :disabled="!bothReady"
          @extract="handleCheck"
          @finished="onStepStripFinished"
        />

        <div v-if="checkError" class="error-message">
          {{ checkError }}
        </div>
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
  padding: 40px 32px;
  gap: 32px;
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  width: 100%;
}

.error-message {
  padding: 12px 20px;
  background: var(--color-error-soft, #FADCDA);
  border: 0.7px solid color-mix(in srgb, var(--color-error, #E74C3C) 40%, transparent);
  border-radius: 8px;
  color: var(--color-error, #E74C3C);
  font-size: 14px;
  font-family: "SourceHanSans-Regular", var(--font-family-cn);
  text-align: center;
  max-width: 720px;
}

@media (max-width: 640px) {
  .upload-body {
    padding: 24px 16px;
  }
}
</style>
