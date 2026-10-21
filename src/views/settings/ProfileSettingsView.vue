<script setup lang="ts">
</script>

<template>
  <div class="profile-view">
    <div class="page-header-card">
      <div class="header-content">
        <div class="header-info">
          <div class="breadcrumb">
            <span>首页</span>
            <span class="sep">/</span>
            <span>设置中心</span>
            <span class="sep">/</span>
            <span class="current">个性设置</span>
          </div>
          <div class="header-title">
            <h1>个性设置</h1>
            <p>个性化定制您的使用体验</p>
          </div>
        </div>
      </div>
    </div>

    <div class="section-card coming-soon">
      <RiHourglassLine class="icon" />
      <h2>敬请期待</h2>
      <p>功能正在开发中，敬请期待</p>
    </div>
  </div>
</template>

<style scoped>
.profile-view {
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
.header-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-family: "SourceHanSans-Regular", var(--font-family-cn);
}
.breadcrumb span {
  color: var(--color-text-faint, #A7A296);
}
.breadcrumb span.sep {
  color: var(--color-text-faint, #A7A296);
}
.breadcrumb span.current {
  color: var(--color-text-body, #3A3A3A);
  font-weight: 500;
}
.header-title h1 {
  font-size: 30px;
  font-weight: 700;
  color: var(--color-text-primary, #1F1D1A);
  margin: 12px 0 0 0;
  letter-spacing: -0.5px;
  font-family: "SourceHanSans-Bold", var(--font-family-cn);
  line-height: 1.2;
}
.header-title p {
  font-size: 15px;
  color: var(--color-text-secondary, #6E6A60);
  margin: 8px 0 0 0;
  font-family: "SourceHanSans-Regular", var(--font-family-cn);
}

/* 敬请期待 */
.section-card {
  background-color: var(--color-bg-white, #FFFFFF);
  border: 0.7px solid var(--color-border-soft, #EDE9E0);
  border-radius: 16px;
  padding: 24px 40px;
}
.coming-soon {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 80px 40px;
  text-align: center;
}
.coming-soon .icon {
  font-family: "remixicon", sans-serif;
  font-style: normal;
  font-size: 48px;
  color: var(--color-text-muted, #8A8578);
}
.coming-soon h2 {
  font-size: 22px;
  font-weight: 600;
  color: var(--color-text-primary, #1F1D1A);
  margin: 0;
  font-family: "SourceHanSans-Medium", var(--font-family-cn);
}
.coming-soon p {
  font-size: 15px;
  color: var(--color-text-muted, #8A8578);
  margin: 0;
  font-family: "SourceHanSans-Regular", var(--font-family-cn);
}
</style>
