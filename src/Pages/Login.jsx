import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // 🌟 State สำหรับระบบแจ้งเตือนแบบป๊อปอัป (Toast)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // 🌟 ฟังก์ชันเรียกป๊อปอัป
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    // ให้ป๊อปอัปหายไปเองใน 3 วินาที (กรณี error)
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        showToast('เข้าสู่ระบบสำเร็จ!', 'success');
        
        // หน่วงเวลา 1.5 วินาทีให้โชว์ป๊อปอัปก่อน แล้วค่อยรีโหลดหน้า
        setTimeout(() => {
          navigate('/');
          window.location.reload(); 
        }, 1500);

      } else {
        showToast(`เข้าสู่ระบบไม่สำเร็จ: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      showToast('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', 'error');
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const response = await fetch('http://localhost:5000/api/google-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: tokenResponse.access_token })
        });

        const data = await response.json();

        if (response.ok) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          showToast('เข้าสู่ระบบด้วย Google สำเร็จ!', 'success');
          
          setTimeout(() => {
            navigate('/');
            window.location.reload();
          }, 1500);

        } else {
          showToast(`ไม่สามารถเข้าสู่ระบบได้: ${data.error}`, 'error');
        }
      } catch (error) {
        console.error('Error with Google Login:', error);
        showToast('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', 'error');
      }
    },
    onError: () => {
      showToast('การเข้าสู่ระบบด้วย Google ล้มเหลว', 'error');
    }
  });

  return (
    <div className="py-5" style={{ backgroundColor: '#F8F6F3', minHeight: '90vh', position: 'relative' }}>
      
      {/* 🌟 ป๊อปอัปแจ้งเตือน (Toast Notification) */}
      <div style={{
        position: 'fixed',
        top: toast.show ? '30px' : '-100px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: toast.type === 'success' ? '#5C4E43' : '#b87373',
        color: '#ffffff',
        padding: '14px 28px',
        borderRadius: '50px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        transition: 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontWeight: 'bold',
        opacity: toast.show ? 1 : 0
      }}>
        <span style={{ fontSize: '18px' }}>{toast.type === 'success' ? '✅' : '⚠️'}</span>
        {toast.message}
      </div>

      <div className="container py-4">
        <div className="row align-items-center justify-content-center g-5">
          
          {/* ฝั่งซ้าย: โฆษณาและจุดเด่น */}
          <div className="col-lg-6 d-none d-lg-block pe-5">
            <div className="mb-2">
              <img 
                src="/KickZone(1).png" 
                alt="KickZone Logo" 
                style={{ width: '300px', objectFit: 'contain', transform: 'scale(1.8)', transformOrigin: 'left center' }} 
              />
            </div>
            
            <div className="d-inline-block px-4 py-2 rounded-pill mb-3 fw-bold shadow-sm" style={{ backgroundColor: '#E8E1D9', color: '#5C4E43' }}>
              ช้อปกับเราง่ายๆ ใน 5 ขั้นตอน
            </div>
            <p className="mb-5 fs-5" style={{ color: '#8C7A6B' }}>
              ซื้อสินค้าพรีเมียมของแท้ได้อย่างมั่นใจ<br/>เพราะเราตรวจสอบของทุกชิ้นก่อนส่งถึงคุณ
            </p>
            
            <div className="d-flex gap-2 text-center mt-4">
              {[
                { icon: "🏷️", text: "เลือกสินค้า" },
                { icon: "⏳", text: "ผู้ขายยืนยัน" },
                { icon: "🔎", text: "ตรวจสอบ" },
                { icon: "✅", text: "ผ่านการตรวจ" },
                { icon: "📦", text: "รับของเลย!" }
              ].map((step, idx) => (
                <div key={idx} className="bg-white p-3 rounded-4 shadow-sm border-0 flex-fill" style={{ fontSize: '12px' }}>
                  <div className="fs-3 mb-2">{step.icon}</div>
                  <div className="fw-bold" style={{ color: '#5C4E43' }}>{step.text}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ฝั่งขวา: ฟอร์มเข้าสู่ระบบ */}
          <div className="col-lg-5 col-md-8">
            <div className="card border-0 shadow-sm rounded-4 p-5 bg-white">
              
              <div className="text-center mb-4">
                <div className="mb-2 d-flex justify-content-center">
                  <img 
                    src="/KickZone(1).png" 
                    alt="KickZone Logo" 
                    style={{ width: '220px', objectFit: 'contain', transform: 'scale(1.5)' }} 
                  />
                </div>
                <h4 className="fw-bold" style={{ color: '#5C4E43' }}>เข้าสู่ระบบ</h4>
              </div>
              
              <form onSubmit={onSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-bold mb-1" style={{ color: '#8C7A6B' }}>อีเมล</label>
                  <input type="email" className="form-control form-control-lg rounded-3 bg-light border-0" required value={email} onChange={e => setEmail(e.target.value)} placeholder="อีเมล" style={{ fontSize: '14px' }} />
                </div>
                <div className="mb-4">
                  <label className="form-label small fw-bold mb-1" style={{ color: '#8C7A6B' }}>รหัสผ่าน</label>
                  <input type="password" className="form-control form-control-lg rounded-3 bg-light border-0" required value={password} onChange={e => setPassword(e.target.value)} placeholder="รหัสผ่าน" style={{ fontSize: '14px' }} />
                </div>
                <button type="submit" className="btn btn-lg w-100 mb-3 rounded-pill fw-bold text-white shadow-sm" style={{ fontSize: '15px', backgroundColor: '#8C7A6B' }}>
                  เข้าสู่ระบบ
                </button>
              </form>

              <div className="text-end mb-4">
                <a href="#" className="small text-decoration-none" style={{ color: '#8C7A6B' }}>ลืมรหัสผ่าน?</a>
              </div>

              <div className="d-flex align-items-center mb-4 mt-3">
                <hr className="flex-grow-1" style={{ borderColor: '#E8E1D9' }} />
                <span className="mx-3 small fw-bold" style={{ color: '#8C7A6B' }}>หรือ</span>
                <hr className="flex-grow-1" style={{ borderColor: '#E8E1D9' }} />
              </div>

              <div className="mb-4">
                <button 
                  type="button" 
                  className="btn bg-white border w-100 fw-bold py-2 d-flex align-items-center justify-content-center gap-2 rounded-pill shadow-sm"
                  style={{ borderColor: '#E8E1D9', color: '#5C4E43' }}
                  onClick={() => loginWithGoogle()}
                >
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" 
                    alt="Google Logo" 
                    width="20" 
                    height="20" 
                  />
                  เข้าสู่ระบบด้วย Google
                </button>
              </div>

              <div className="text-center mt-2 small">
                <span style={{ color: '#8C7A6B' }}>ยังไม่มีบัญชี? </span>
                <Link to="/register" className="fw-bold text-decoration-underline" style={{ color: '#5C4E43' }}>สมัครสมาชิก</Link>
              </div>
            </div>

            <div className="text-center mt-3" style={{ fontSize: '11px', color: '#8C7A6B' }}>
              ทดสอบระบบ Admin: admin@kickzone.com / Pass: admin123
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}