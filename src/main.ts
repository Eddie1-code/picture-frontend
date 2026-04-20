
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import Antd from 'ant-design-vue';
import VueCropper from 'vue-cropper';
import 'ant-design-vue/dist/reset.css';
import '@/styles/design-system.css';
import '@/access.ts' // 引入权限控制文件
import 'vue-cropper/dist/index.css'

const app = createApp(App);


app.use(createPinia())
app.use(router)
app.use(Antd)
app.use(VueCropper)

app.mount('#app')


