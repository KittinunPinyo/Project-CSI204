import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar({ searchQuery, setSearchQuery, cart }) {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
    window.location.reload(); 
  };

  return (
    <div className="sticky-top bg-white shadow-sm">
      <nav className="navbar navbar-expand-lg py-3">
        <div className="container px-4">
          
          <Link to="/" className="navbar-brand p-0" style={{ marginTop: '-20px', marginBottom: '-20px' }}>
            <img 
              src="/KickZone(1).png" 
              alt="KickZone Logo" 
              style={{ height: '80px', objectFit: 'contain' }} 
            />
          </Link>
          
          <div className="mx-auto d-none d-lg-block" style={{ width: '40%' }}>
            <input 
              type="text" 
              className="form-control rounded-pill bg-light border-0 px-4" 
              placeholder="ค้นหาสินค้าตามแบรนด์, ชื่อรุ่น..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              style={{ fontSize: '14px', backgroundColor: '#F8F6F3' }}
            />
          </div>

          <div className="d-flex gap-3 align-items-center">
            
            {user && user.role === 'customer' && (
              <div className="d-flex align-items-center gap-3">
                
                {/* 🛒 ไอคอนตะกร้า (โทนสีเบจ/น้ำตาลตุ่น) */}
                <Link 
                  to="/cart" 
                  className="text-decoration-none position-relative d-flex justify-content-center align-items-center rounded-circle" 
                  style={{ width: '45px', height: '45px', backgroundColor: '#F0EBE6' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8C7A6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                  
                  {cart && cart.length > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger shadow-sm" style={{ fontSize: '0.65rem' }}>
                      {cart.length}
                    </span>
                  )}
                </Link>

                {/* 👤 ไอคอนโปรไฟล์ (โทนสีน้ำตาลตุ่น) */}
                <Link 
                  to="/profile" 
                  className="text-decoration-none border d-flex align-items-center px-3 gap-2 rounded-pill bg-white shadow-sm" 
                  style={{ height: '45px', borderColor: '#E8E1D9', color: '#5C4E43' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#8C7A6B" stroke="none">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>สวัสดี, {user.name}</span>
                </Link>
                
              </div>
            )}
            
            {user && user.role === 'admin' && (
              <>
                <span className="fw-bold d-none d-md-block" style={{ color: '#8C7A6B' }}>👑 แอดมิน {user.name}</span>
                <Link to="/admin" className="btn rounded-pill px-4 text-white shadow-sm" style={{ backgroundColor: '#8C7A6B' }}>ระบบจัดการ</Link>
              </>
            )}

            {user ? (
              <button className="btn rounded-pill px-4 ms-2 bg-white shadow-sm" style={{ borderColor: '#8C7A6B', color: '#8C7A6B' }} onClick={handleLogout}>ออกจากระบบ</button>
            ) : (
              <Link to="/login" className="btn rounded-pill px-4 text-white shadow-sm" style={{ backgroundColor: '#8C7A6B' }}>เข้าสู่ระบบ</Link>
            )}

          </div>
        </div>
      </nav>
    </div>
  );
}