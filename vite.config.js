import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ให้ระบบเช็คว่าถ้าเป็นการ Build ขึ้นเว็บจริง ค่อยใช้ /KickZone-Shoe/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/KickZone-Shoe/' : '/',
}))