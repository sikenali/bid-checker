<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { UiModal } from '@/components/ui';
import { riToCompName } from '@/utils/icon';
import ThemeSettingsView from '@/views/settings/ThemeSettingsView.vue';
import SkillSettingsView from '@/views/settings/SkillSettingsView.vue';
import ApiKeySettingsView from '@/views/settings/ApiKeySettingsView.vue';
import ExportSettingsView from '@/views/settings/ExportSettingsView.vue';
import ProfileSettingsView from '@/views/settings/ProfileSettingsView.vue';
import AboutSettingsView from '@/views/settings/AboutSettingsView.vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:visible']);

const modalVisible = computed({
  get: () => props.visible,
  set: (v: boolean) => emit('update:visible', v),
});

const menuItems = [
  { key: 'theme', label: '主题设置', icon: 'ri-palette-line', component: ThemeSettingsView },
  { key: 'skill', label: '技能设置', icon: 'ri-git-branch-line', component: SkillSettingsView },
  { key: 'model', label: '模型设置', icon: 'ri-cpu-line', component: ApiKeySettingsView },
  { key: 'export', label: '导出设置', icon: 'ri-download-2-line', component: ExportSettingsView },
  { key: 'profile', label: '个性设置', icon: 'ri-user-settings-line', component: ProfileSettingsView },
  { key: 'about', label: '关于', icon: 'ri-information-line', component: AboutSettingsView },
];

const activeKey = ref('theme');

watch(() => props.visible, (v) => {
  if (v) activeKey.value = 'theme';
});

const activeComponent = computed(() => {
  return menuItems.find(i => i.key === activeKey.value)?.component;
});

function selectTab(key: string) {
  activeKey.value = key;
}
</script>

<template>
  <UiModal
    v-model="modalVisible"
    title="设置中心"
    subtitle="选择要进入的设置界面"
    icon="ri-settings-3-line"
    width="92vw"
    :max-width="1400"
    height="92vh"
    :fixed-height="true"
    :show-footer="false"
    :close-on-click-overlay="false"
  >
    <div class="settings-body">
      <nav class="nav-list">
        <div
          v-for="item in menuItems"
          :key="item.key"
          class="nav-item"
          :class="{ active: activeKey === item.key }"
          @click="selectTab(item.key)"
        >
          <component :is="riToCompName(item.icon)" class="icon" size="20" />
          <span class="label">{{ item.label }}</span>
        </div>
      </nav>
      <div class="panel-content">
        <component :is="activeComponent" :key="activeKey" />
      </div>
    </div>
  </UiModal>
</template>

<style scoped>
.settings-body {
  display: flex;
  gap: 20px;
  flex: 1;
  min-height: 0;
  padding: 0;
}

.nav-list {
  width: 240px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  background: var(--color-bg-white, #FFFFFF);
  border: 0.7px solid var(--color-border-soft, #EDE9E0);
  border-radius: 16px;
  padding: 16px;
}

.nav-item {
  height: 52px;
  padding: 0 20px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.nav-item:hover {
  background-color: var(--color-bg-secondary, #F7F3EA);
}

.nav-item .icon {
  color: var(--color-text-body, #3A3A3A);
  width: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
}

.nav-item .label {
  font-size: 15px;
  color: var(--color-text-body, #3A3A3A);
  font-family: "SourceHanSans-Regular", var(--font-family-cn);
  white-space: nowrap;
}

.nav-item.active {
  background-color: var(--color-primary-soft, #FBE9E7);
}

.nav-item.active .icon,
.nav-item.active .label {
  color: var(--color-primary, #C0392B);
  font-weight: 500;
}

.panel-content {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding-right: 4px;
}

.panel-content :deep(.page-header-card) {
  display: none;
}
</style>
