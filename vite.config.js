import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Tối ưu chunk size
    rollupOptions: {
      output: {
        manualChunks: {
          // Tách Firebase thành chunk riêng
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          // Tách React và các vendor khác
          vendor: ['react', 'react-dom'],
          // Tách icons
          icons: ['lucide-react'],
        },
      },
    },
    // Tăng giới hạn cảnh báo
    chunkSizeWarningLimit: 300,
  },
})
