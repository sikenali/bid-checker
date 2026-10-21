<script setup lang="ts">
import MainApp from '@/components/layout/MainApp.vue';
import SettingsModal from '@/components/layout/SettingsModal.vue';
</script>

<template>
  <MainApp>
    <SettingsModal :visible="true" />
  </MainApp>
</template>
