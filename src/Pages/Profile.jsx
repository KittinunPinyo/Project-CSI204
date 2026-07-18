import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

/* STREAMING_CHUNK: Defining delivery step logic from database statuses... */
// ฟังก์ชันวิเคราะห์สถานะเพื่อขยับ Stepper เพียงจุดเดียวแบบอัจฉริยะ
const getDeliveryStep = (paymentStatus, orderStatus) => {
  const payNorm = (paymentStatus || '').trim().toUpperCase();
  const orderNorm = (orderStatus || '').trim().toUpperCase();

  // 1. ยังไม่ได้สแกนสลิปจริง หรือรอตรวจสอบ -> สเต็ป 0 (ได้รับออเดอร์แล้ว/รอชำระเงิน)
  if (payNorm === 'PENDING UPLOAD' || payNorm === 'รอชำระเงิน' || payNorm === 'PENDING VERIFICATION' || payNorm === 'รอตรวจสอบสลิป') {
    return 0; 
  }
  // 2. ชำระเงินผ่านแล้ว และอยู่ในขั้นเตรียมแพ็คของ -> สเต็ป 1 (กำลังจัดเตรียมพัสดุ)
  if (orderNorm === 'PROCESSING' || orderNorm === 'เตรียมจัดส่ง') {
    return 1;
  }
  // 3. แนบเลขแทร็กและนำส่งขนส่งแล้ว -> สเต็ป 2 (ส่งพัสดุแล้ว)
  if (orderNorm === 'SHIPPED' || orderNorm === 'จัดส่งแล้ว') {
    return 2;
  }
  // 4. พัสดุถึงมือลูกค้าสำเร็จเสร็จสิ้น -> สเต็ป 3 (สำเร็จเรียบร้อย)
  if (orderNorm === 'DELIVERED' || orderNorm === 'สำเร็จ') {
    return 3;
  }
  return 0;
};

/* STREAMING_CHUNK: Helper text function based on combined status... */
// ฟังก์ชันส่งคืนข้อความบรรยายสั้น ๆ ใต้รหัสสั่งซื้อ เพื่ออธิบายสเต็ปปัจจุบันให้เข้าใจง่าย
const getStatusDescriptionText = (paymentStatus, orderStatus) => {
  const payNorm = (paymentStatus || '').trim().toUpperCase();
  const orderNorm = (orderStatus || '').trim().toUpperCase();

  if (payNorm === 'PENDING UPLOAD' || payNorm === 'รอชำระเงิน') {
    return '⏳ รอการชำระเงินจากคุณ';
  }
  if (payNorm === 'PENDING VERIFICATION' || payNorm === 'รอตรวจสอบสลิป') {
    return '🕒 อยู่ระหว่างการตรวจสอบรูปภาพสลิปโอนเงิน';
  }
  if (payNorm === 'PAID' || payNorm === 'ชำระเงินสำเร็จ') {
    if (orderNorm === 'SHIPPED' || orderNorm === 'จัดส่งแล้ว') return '🚚 พัสดุถูกจัดส่งออกเรียบร้อยแล้ว';
    if (orderNorm === 'DELIVERED' || orderNorm === 'สำเร็จ') return '🏠 รายการสั่งซื้อเสร็จสมบูรณ์เรียบร้อย';
    return '📦 ชำระเงินสำเร็จแล้ว • อยู่ระหว่างการแพ็คเตรียมจัดส่ง';
  }
  return '📝 ได้รับรายการสั่งซื้อเข้าสู่ระบบ';
};

export default function Profile() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  /* STREAMING_CHUNK: Fetching current logged user configuration... */
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      // ดึงโปรไฟล์ลูกค้าตัวอย่างเพื่อความเสถียรตรงตามภาพอ้างอิง image_8dbfbc.png
      const mockUser = {
        name: 'ธนวิศิษฐ์ อินต๊ะแสน',
        email: 'uro4544@gmail.com'
      };
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
    }
  }, []);

  /* STREAMING_CHUNK: Realtime sync database query with API Polling... */
  const fetchOrdersFromDatabase = async () => {
    if (!user?.email) return;
    try {
      const response = await fetch(`${API_URL}/orders`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (err) {
      console.error("การดึงข้อมูลออเดอร์มีข้อผิดพลาด:", err);
    } finally {
      setLoading(false);
    }
  };

  // ดึงประวัติสั่งซื้อทุก ๆ 3 วินาที เพื่อรีเฟรชข้อมูลตามหน้าจอแอดมินโดยตรงแบบเรียลไทม์
  useEffect(() => {
    if (user?.email) {
      fetchOrdersFromDatabase();
      const interval = setInterval(fetchOrdersFromDatabase, 3000);
      return () => clearInterval(interval);
    }
  }, [user]);

  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#737373' }}>
        กำลังดึงข้อมูลบัญชีผู้ใช้...
      </div>
    );
  }

  // ครองเฉพาะออเดอร์จริงของอีเมลลูกค้ารายนี้
  const myOrders = orders.filter(o => 
    (o.customer_email || o.customerEmail || '').trim().toLowerCase() === user.email.trim().toLowerCase()
  );

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#fafafa', minHeight: '100vh', padding: '40px 16px', color: '#000000' }}>
      <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
        
        {/* บัญชีของฉัน */}
        <h2 style={{ fontSize: '22px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px', letterSpacing: '0.5px' }}>
          <span style={{ fontSize: '24px' }}></span> บัญชีของฉัน
        </h2>

        {/* กริดแบ่งฝั่ง ข้อมูลโปรไฟล์ และ ประวัติสั่งซื้อ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }} className="grid lg:grid-cols-3">
          
          {/* ซ้าย: ข้อมูลส่วนตัวลูกค้า */}
          <div>
            <div style={{ 
              backgroundColor: '#ffffff', 
              padding: '40px 24px', 
              borderRadius: '0px', 
              border: '1px solid #e5e5e5', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.01)', 
              textAlign: 'center' 
            }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                backgroundColor: '#000000', 
                color: '#ffffff', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '28px', 
                fontWeight: '900', 
                margin: '0 auto 20px auto' 
              }}>
                {user.name ? user.name.charAt(0).toUpperCase() : 'ธ'}
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: '900', margin: '0 0 6px 0', letterSpacing: '0.5px' }}>{user.name}</h3>
              <p style={{ fontSize: '14px', color: '#737373', margin: '0 0 32px 0' }}>{user.email}</p>

              <Link 
                to="/" 
                style={{ 
                  display: 'block',
                  width: '100%', 
                  padding: '12px', 
                  border: '1px solid #000000', 
                  backgroundColor: '#ffffff', 
                  color: '#000000', 
                  borderRadius: '0px', 
                  fontSize: '13px', 
                  fontWeight: '800', 
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  boxSizing: 'border-box',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => { e.target.style.backgroundColor = '#000000'; e.target.style.color = '#ffffff'; }}
                onMouseLeave={(e) => { e.target.style.backgroundColor = '#ffffff'; e.target.style.color = '#000000'; }}
              >
                ไปช้อปปิ้งต่อ
              </Link>
            </div>
          </div>

          {/* ขวา: ประวัติคำสั่งซื้อชุดคลีนสุดพรีเมียม (ถอดการแสดงป้ายชำระเงินที่ซ้ำซ้อนออก) */}
          <div className="lg:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ 
              backgroundColor: '#ffffff', 
              padding: '32px 24px', 
              borderRadius: '0px', 
              border: '1px solid #e5e5e5', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.01)',
              minHeight: '350px'
            }}>
              
              <h3 style={{ 
                fontSize: '15px', 
                fontWeight: '900', 
                margin: '0 0 24px 0', 
                textTransform: 'uppercase', 
                letterSpacing: '1px',
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                borderBottom: '2px solid #000000',
                paddingBottom: '12px'
              }}>
                📦 ประวัติการสั่งซื้อล่าสุด
              </h3>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '80px 0', color: '#737373', fontSize: '13px' }}>
                  กำลังเชื่อมต่อข้อมูลพัสดุ...
                </div>
              ) : myOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0', color: '#737373' }}>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', color: '#000000' }}>คุณยังไม่มีประวัติการสั่งซื้อ</p>
                  <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#a3a3a3' }}>เมื่อสั่งซื้อพัสดุของคุณจะขึ้นโชว์ความคืบหน้าที่นี่ทันทีครับ</p>
                </div>
              ) : (
                /* รายการออเดอร์สไตล์โมโนโครมแบบคลีนสูงสุด */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  {myOrders.map(order => {
                    const currentStep = getDeliveryStep(order.paymentStatus || order.status, order.orderStatus);
                    const statusText = getStatusDescriptionText(order.paymentStatus || order.status, order.orderStatus);

                    return (
                      <div 
                        key={order.id} 
                        style={{ 
                          border: '1px solid #e5e5e5', 
                          borderRadius: '0px', 
                          padding: '24px', 
                          backgroundColor: '#ffffff'
                        }}
                      >
                        {/* รหัสสั่งซื้อ และ วันที่ */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f5f5f5', paddingBottom: '12px', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                          <div>
                            <span style={{ fontSize: '11px', color: '#737373', display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>รหัสคำสั่งซื้อ</span>
                            <strong style={{ fontSize: '16px', color: '#000000', letterSpacing: '0.5px' }}>{order.id}</strong>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '11px', color: '#737373', display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>วันที่สั่งซื้อ</span>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#000000' }}>
                              {order.order_date || (order.createdAt ? new Date(order.createdAt).toISOString() : '-')}
                            </span>
                          </div>
                        </div>

                        {/* รุ่นและยอดรวม และข้อความบรรยายสเตตัสข้างใต้ */}
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '24px' }}>
                          <div>
                            <span style={{ fontSize: '11px', color: '#737373', display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>รุ่นและขนาดรองเท้าที่เลือก</span>
                            <span style={{ fontSize: '14px', fontWeight: '800', color: '#000000', marginTop: '2px', display: 'block' }}>
                              👟 {order.shoeModel || order.shoe_model || 'สินค้าจาก KickZone'} (ไซส์: {order.size || 'N/A'})
                            </span>
                            
                            {/* บรรยายสถานะผสมผสานอย่างเรียบหรูใต้ชื่อสินค้า */}
                            <span style={{ fontSize: '12px', fontWeight: '700', color: '#404040', display: 'block', marginTop: '10px' }}>
                              {statusText}
                            </span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '11px', color: '#737373', display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>ยอดรวมสุทธิ</span>
                            <span style={{ fontSize: '18px', fontWeight: '950', color: '#000000', marginTop: '2px', display: 'block' }}>
                              ฿{Number(order.totalAmount || order.total || 0).toLocaleString()}
                            </span>
                            
                            {/* แสดงเลขพัสดุถ้ามีจัดส่งแล้ว */}
                            {order.trackingNumber && order.trackingNumber !== 'N/A' && (
                              <span style={{ fontSize: '11px', fontWeight: '800', color: '#ffffff', backgroundColor: '#000000', padding: '3px 8px', marginTop: '8px', display: 'inline-block', letterSpacing: '0.5px' }}>
                                📦 {order.trackingNumber}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* แถบติดตามสถานะชิ้นเดียวครอบจักรวาล (Monochrome Stepper) */}
                        <div style={{ marginTop: '20px', borderTop: '1px solid #f5f5f5', paddingTop: '20px' }}>
                          <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 10px' }}>
                            
                            {/* เส้นเชื่อมด้านหลัง */}
                            <div style={{ 
                              position: 'absolute', 
                              top: '15px', 
                              left: '0', 
                              right: '0', 
                              height: '2px', 
                              backgroundColor: '#e5e5e5', 
                              zIndex: 1 
                            }} />
                            
                            {/* แถบขยับสีดำจริง */}
                            <div style={{ 
                              position: 'absolute', 
                              top: '15px', 
                              left: '0', 
                              width: `${(currentStep / 3) * 100}%`, 
                              height: '2px', 
                              backgroundColor: '#000000', 
                              zIndex: 2,
                              transition: 'width 0.4s ease-in-out'
                            }} />

                            {/* สเต็ปย่อยทั้ง 4 จุด */}
                            <StepNode isActive={currentStep >= 0} label="ได้รับออเดอร์" icon="📝" />
                            <StepNode isActive={currentStep >= 1} label="กำลังจัดเตรียม" icon="📦" />
                            <StepNode isActive={currentStep >= 2} label="ส่งพัสดุแล้ว" icon="🚚" />
                            <StepNode isActive={currentStep >= 3} label="สำเร็จเรียบร้อย" icon="🏠" />

                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

/* STREAMING_CHUNK: StepNode subcomponent for clean styling... */
function StepNode({ isActive, label, icon }) {
  return (
    <div style={{ zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '70px' }}>
      <div style={{ 
        width: '32px', 
        height: '32px', 
        borderRadius: '50%', 
        backgroundColor: isActive ? '#000000' : '#ffffff', 
        border: isActive ? '2px solid #000000' : '2px solid #cbd5e1',
        color: isActive ? '#ffffff' : '#cbd5e1',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        fontSize: '14px',
        fontWeight: 'bold',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        transition: 'all 0.4s ease'
      }}>
        {icon}
      </div>
      <span style={{ 
        fontSize: '10px', 
        fontWeight: isActive ? '900' : '500', 
        color: isActive ? '#000000' : '#a3a3a3', 
        marginTop: '8px',
        display: 'block',
        letterSpacing: '0.5px'
      }}>
        {label}
      </span>
    </div>
  );
}