import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/KickZone-Shoe/', // 👈 เพิ่มบรรทัดนี้เข้าไป (ต้องมี / ปิดหน้าและหลัง)
})
