import { createApp } from 'vue';
import { createPinia } from 'pinia';
import {
  RiAddLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCheckLine,
  RiCloseCircleFill,
  RiCloseCircleLine,
  RiCloseLine,
  RiCpuLine,
  RiCodeSSlashLine,
  RiDeleteBinLine,
  RiDownload2Line,
  RiEditLine,
  RiExternalLinkLine,
  RiEyeLine,
  RiEyeOffLine,
  RiFileEditLine,
  RiFileListLine,
  RiFileUploadLine,
  RiGitBranchLine,
  RiGithubLine,
  RiHourglassLine,
  RiInformationLine,
  RiLayoutColumnLine,
  RiLayoutGridLine,
  RiLinksLine,
  RiLoader4Line,
  RiMore2Line,
  RiPaletteLine,
  RiPriceTagLine,
  RiRefreshLine,
  RiRestartLine,
  RiSearchLine,
  RiSettings3Line,
  RiShieldCheckLine,
  RiTargetLine,
  RiUploadCloud2Line,
  RiUserSettingsLine,
} from '@remixicon/vue';
import App from './App.vue';
import router from './router';
import './assets/global.css';
import { BRAND_TITLE } from './constants/brand';

document.title = BRAND_TITLE;

const app = createApp(App);
app.use(createPinia());
app.use(router);

// 仅注册实际用到的图标，避免全量引入 3227 个图标组件
const icons = {
  RiAddLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCheckLine,
  RiCloseCircleFill,
  RiCloseCircleLine,
  RiCloseLine,
  RiCpuLine,
  RiCodeSSlashLine,
  RiDeleteBinLine,
  RiDownload2Line,
  RiEditLine,
  RiExternalLinkLine,
  RiEyeLine,
  RiEyeOffLine,
  RiFileEditLine,
  RiFileListLine,
  RiFileUploadLine,
  RiGitBranchLine,
  RiGithubLine,
  RiHourglassLine,
  RiInformationLine,
  RiLayoutColumnLine,
  RiLayoutGridLine,
  RiLinksLine,
  RiLoader4Line,
  RiMore2Line,
  RiPaletteLine,
  RiPriceTagLine,
  RiRefreshLine,
  RiRestartLine,
  RiSearchLine,
  RiSettings3Line,
  RiShieldCheckLine,
  RiTargetLine,
  RiUploadCloud2Line,
  RiUserSettingsLine,
};

for (const [name, component] of Object.entries(icons)) {
  app.component(name, component);
}

app.mount('#app');
