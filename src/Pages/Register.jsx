import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert("สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ");
        navigate('/login');
      } else {
        alert(data.error);
      }
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
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
          alert('เข้าสู่ระบบด้วย Google สำเร็จ!');
          navigate('/');
          window.location.reload();
        } else {
          alert(`ไม่สามารถสมัคร/เข้าสู่ระบบได้: ${data.error}`);
        }
      } catch (error) {
        console.error('Error with Google Login:', error);
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
      }
    },
    onError: () => {
      alert('การเข้าสู่ระบบด้วย Google ล้มเหลว');
    }
  });

  return (
    // 🌟 เปลี่ยนสีพื้นหลัง
    <div className="py-5" style={{ backgroundColor: '#F8F6F3', minHeight: '90vh' }}>
      <div className="container py-4">
        <div className="row align-items-center justify-content-center g-5">
          
          <div className="col-lg-6 d-none d-lg-block pe-5">
            <div className="mb-2">
              <img 
                src="/KickZone(1).png" 
                alt="KickZone Logo" 
                style={{ width: '300px', objectFit: 'contain', transform: 'scale(1.8)', transformOrigin: 'left center' }} 
              />
            </div>
            
            <div className="d-inline-block px-4 py-2 rounded-pill mb-3 fw-bold shadow-sm" style={{ backgroundColor: '#E8E1D9', color: '#5C4E43' }}>
              เริ่มต้นช้อปปิ้งกับเรา
            </div>
            <p className="mb-5 fs-5" style={{ color: '#8C7A6B' }}>
              สมัครสมาชิกวันนี้เพื่อรับสิทธิพิเศษ<br/>และติดตามสถานะการสั่งซื้อของคุณได้ตลอด 24 ชม.
            </p>
          </div>

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
                <h4 className="fw-bold" style={{ color: '#5C4E43' }}>สมัครสมาชิก</h4>
              </div>
              
              <form onSubmit={handleRegister}>
                <div className="mb-3">
                  <label className="form-label small fw-bold mb-1" style={{ color: '#8C7A6B' }}>ชื่อ - นามสกุล</label>
                  <input type="text" className="form-control form-control-lg rounded-3 bg-light border-0" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="ชื่อ-นามสกุล" style={{ fontSize: '14px' }} />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold mb-1" style={{ color: '#8C7A6B' }}>อีเมล</label>
                  <input type="email" className="form-control form-control-lg rounded-3 bg-light border-0" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="อีเมล" style={{ fontSize: '14px' }} />
                </div>
                <div className="mb-4">
                  <label className="form-label small fw-bold mb-1" style={{ color: '#8C7A6B' }}>รหัสผ่าน</label>
                  <input type="password" className="form-control form-control-lg rounded-3 bg-light border-0" required minLength="6" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="รหัสผ่าน (ขั้นต่ำ 6 ตัวอักษร)" style={{ fontSize: '14px' }} />
                </div>
                <button type="submit" className="btn btn-lg w-100 mb-3 rounded-pill fw-bold text-white shadow-sm" style={{ fontSize: '15px', backgroundColor: '#8C7A6B' }}>
                  สร้างบัญชีใหม่
                </button>
              </form>

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
                  สมัครสมาชิกด้วย Google
                </button>
              </div>

              <div className="text-center mt-2 small">
                <span style={{ color: '#8C7A6B' }}>มีบัญชีอยู่แล้ว? </span>
                <Link to="/login" className="fw-bold text-decoration-underline" style={{ color: '#5C4E43' }}>เข้าสู่ระบบ</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}