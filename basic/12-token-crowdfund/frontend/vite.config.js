import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    //设置 server.hmr.overlay 为 false 可以禁用开发服务器错误的屏蔽
    hmr: { overlay: false },
    //开发时启动的端口
    port: 5001,
    //在服务器启动时自动在浏览器中打开应用程序
    open: false,
    //true, 启用并允许任何源
    cors: true,
    https: false, //启用https
    //代理跨域配置
  },
})
