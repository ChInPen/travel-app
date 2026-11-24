import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import VueRouter from 'vue-router/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    VueRouter({
      // 預設掃描 src/views 的資料夾
      routesFolder: 'src/views',
      dts: 'src/typed-router.d.ts',
    }),
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
