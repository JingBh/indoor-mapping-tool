import { createApp } from 'vue'
import {
  ElAside,
  ElButton,
  ElContainer,
  ElForm,
  ElFormItem,
  ElInput,
  ElMain
} from 'element-plus'

import App from './App.vue'

import './assets/styles/tailwind.css'
import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/container/style/css'
import 'element-plus/es/components/form/style/css'
import 'element-plus/es/components/form-item/style/css'
import 'element-plus/es/components/input/style/css'

const app = createApp(App)

app.use(ElAside)
app.use(ElButton)
app.use(ElContainer)
app.use(ElForm)
app.use(ElFormItem)
app.use(ElInput)
app.use(ElMain)

app.mount('#app')
