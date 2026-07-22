import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import { GoogleOAuthProvider } from '@react-oauth/google' // 🌟 1. นำเข้าไลบรารี Google

// 🌟 2. ใส่ Client ID ของ Google
// (อันนี้เป็นไอดีทดสอบสำหรับรันบน localhost ถ้าเอาขึ้นเว็บจริงต้องไปสร้างใหม่ที่ Google Cloud Console)
const GOOGLE_CLIENT_ID = "50847339110-gi5e17b5ldlti3uqquvqmvfmgsf4lf8p.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 🌟 เพิ่ม basename ให้ตรงกับชื่อ Repository ของ GitHub Pages */}
    <BrowserRouter basename="/KickZone-Shoe">
      {/* 🌟 3. ครอบ App ด้วย GoogleOAuthProvider */}
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <App />
      </GoogleOAuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)