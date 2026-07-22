import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ManagePromotions = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    maxDiscount: '',
    maxUses: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    isFlashSale: false,
    isActive: true,
    minimumOrderAmount: '',
    maximumOrderAmount: ''
  });

  // 🌟 State สำหรับแจ้งเตือน (Toast) แทน alert()
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const response = await axios.get('http://localhost:5000/api/admin/promotions', config);
      setPromotions(response.data);
    } catch (error) {
      console.error('Error fetching promotions', error);
      if (error.response?.status === 403) showToast('คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (เฉพาะ Admin)', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      maxDiscount: '',
      maxUses: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      isFlashSale: false,
      isActive: true,
      minimumOrderAmount: '',
      maximumOrderAmount: ''
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.code || !formData.description || !formData.discountValue) {
      showToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (editingId) {
        await axios.put(`http://localhost:5000/api/admin/promotions/${editingId}`, formData, config);
        showToast('แก้ไขโปรโมชั่นสำเร็จ', 'success');
      } else {
        await axios.post('http://localhost:5000/api/admin/promotions', formData, config);
        showToast('สร้างโปรโมชั่นสำเร็จ', 'success');
      }

      fetchPromotions();
      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error(error);
      showToast(error.response?.data?.error || 'เกิดข้อผิดพลาดในการบันทึก', 'error');
    }
  };

  const handleEdit = (promo) => {
    setFormData({
      code: promo.code,
      description: promo.description,
      discountType: promo.discount_type,
      discountValue: promo.discount_value,
      maxDiscount: promo.max_discount || '',
      maxUses: promo.max_uses || '',
      startDate: promo.start_date ? promo.start_date.split('T')[0] : '',
      endDate: promo.end_date ? promo.end_date.split('T')[0] : '',
      isFlashSale: promo.is_flash_sale || false,
      isActive: promo.is_active,
      minimumOrderAmount: promo.minimum_order_amount || '',
      maximumOrderAmount: promo.maximum_order_amount || ''
    });
    setEditingId(promo.id);
    setShowForm(true);
  };

  const handleDelete = async (promoId) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.delete(`http://localhost:5000/api/admin/promotions/${promoId}`, config);
      setPromotions(promotions.filter(p => p.id !== promoId));
      setDeleteId(null);
      showToast('ลบโปรโมชั่นสำเร็จ', 'success');
    } catch (error) {
      console.error(error);
      showToast('เกิดข้อผิดพลาดในการลบ', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
        <p style={{ color: '#8C7A6B', fontWeight: 'bold' }}>กำลังโหลดข้อมูลโปรโมชั่น...</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      
      {/* 🌟 ป๊อปอัปแจ้งเตือน (Toast) */}
      <div style={{
        position: 'fixed', top: toast.show ? '30px' : '-100px', left: '50%', transform: 'translateX(-50%)',
        backgroundColor: toast.type === 'success' ? '#5C4E43' : '#b87373', color: '#ffffff',
        padding: '14px 28px', borderRadius: '50px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        transition: 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)', zIndex: 9999,
        display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', opacity: toast.show ? 1 : 0
      }}>
        <span style={{ fontSize: '18px' }}>{toast.type === 'success' ? '✅' : '⚠️'}</span>
        {toast.message}
      </div>

      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #E8E1D9', padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', color: '#5C4E43', fontSize: '22px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🎉</span> จัดการโปรโมชั่น
            </h3>
            <p style={{ margin: 0, color: '#8C7A6B', fontSize: '14px', fontWeight: 'bold' }}>
              จำนวนโปรโมชั่น: <span style={{ color: '#5C4E43' }}>{promotions.length} รายการ</span>
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            style={{ padding: '10px 24px', backgroundColor: '#8C7A6B', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#5C4E43'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#8C7A6B'}
          >
            <span style={{ fontSize: '16px' }}>+</span> เพิ่มโปรโมชั่น
          </button>
        </div>

        {/* Promotions List */}
        {promotions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', backgroundColor: '#F8F6F3', borderRadius: '12px', border: '1px dashed #E8E1D9' }}>
            <span style={{ fontSize: '40px', display: 'block', marginBottom: '16px' }}>📭</span>
            <p style={{ color: '#8C7A6B', fontWeight: 'bold', margin: 0 }}>ยังไม่มีโปรโมชั่นในระบบ</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {promotions.map((promo) => (
              <div key={promo.id} style={{ border: '1px solid #E8E1D9', borderRadius: '12px', padding: '20px', backgroundColor: '#ffffff', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' }}>
                
                {/* ข้อมูลหลัก 3 คอลัมน์ */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '20px', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#8C7A6B', fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase' }}>รหัส</div>
                    <div style={{ fontSize: '16px', color: '#5C4E43', fontWeight: '900', letterSpacing: '0.5px' }}>{promo.code}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#8C7A6B', fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase' }}>รายละเอียด</div>
                    <div style={{ fontSize: '14px', color: '#5C4E43', fontWeight: '600' }}>{promo.description}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#8C7A6B', fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase' }}>ส่วนลด</div>
                    <div style={{ fontSize: '16px', color: '#d97777', fontWeight: '900' }}>
                      {promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `฿${Number(promo.discount_value).toLocaleString('th-TH')}`}
                    </div>
                  </div>
                </div>

                {/* แถบข้อมูลรอง (พื้นหลังครีม) */}
                <div style={{ backgroundColor: '#F8F6F3', borderRadius: '8px', padding: '12px 16px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#8C7A6B', fontWeight: 'bold', marginBottom: '2px' }}>สถานะ</div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', color: promo.is_active ? '#6D8C7A' : '#d97777' }}>
                      {promo.is_active ? '✅ เปิดใช้งาน' : '❌ ปิดใช้งาน'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#8C7A6B', fontWeight: 'bold', marginBottom: '2px' }}>ขั้นต่ำ / สูงสุด</div>
                    <div style={{ fontSize: '12px', color: '#5C4E43', fontWeight: 'bold' }}>
                      {promo.minimum_order_amount ? `฿${promo.minimum_order_amount}` : '0'} / {promo.maximum_order_amount ? `฿${promo.maximum_order_amount}` : '∞'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#8C7A6B', fontWeight: 'bold', marginBottom: '2px' }}>ลดได้สูงสุด</div>
                    <div style={{ fontSize: '12px', color: '#6D8C7A', fontWeight: 'bold' }}>
                      {promo.max_discount ? `฿${Number(promo.max_discount).toLocaleString('th-TH')}` : 'ไม่จำกัด'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#8C7A6B', fontWeight: 'bold', marginBottom: '2px' }}>การใช้งาน</div>
                    <div style={{ fontSize: '12px', color: '#5C4E43', fontWeight: 'bold' }}>
                      {promo.current_uses || 0} / {promo.max_uses || 'ไม่จำกัด'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#8C7A6B', fontWeight: 'bold', marginBottom: '2px' }}>วันสิ้นสุด</div>
                    <div style={{ fontSize: '12px', color: '#5C4E43', fontWeight: 'bold' }}>
                      {promo.end_date ? new Date(promo.end_date).toLocaleDateString('th-TH') : 'ไม่มีกำหนด'}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button 
                    onClick={() => handleEdit(promo)}
                    style={{ padding: '6px 16px', backgroundColor: '#8C7A6B', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span>✏️</span> แก้ไข
                  </button>
                  <button 
                    onClick={() => setDeleteId(promo.id)}
                    style={{ padding: '6px 16px', backgroundColor: '#d97777', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span>🗑️</span> ลบ
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* ==========================================
          Modal: เพิ่ม/แก้ไขโปรโมชั่น
          ========================================== */}
      {showForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(92, 78, 67, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', width: '100%', maxWidth: '700px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', borderRadius: '24px', border: '1px solid #E8E1D9', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
            
            <div style={{ padding: '20px 32px', borderBottom: '1px solid #E8E1D9', backgroundColor: '#ffffff', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '900', margin: 0, color: '#5C4E43' }}>{editingId ? '📝 แก้ไขโปรโมชั่น' : '✨ เพิ่มโปรโมชั่นใหม่'}</h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#8C7A6B' }}>✕</button>
            </div>

            <div style={{ padding: '24px 32px', overflowY: 'auto', flex: 1 }}>
              <form id="promoForm" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8C7A6B', marginBottom: '6px' }}>รหัสโปรโมชั่น</label>
                    <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} disabled={!!editingId} required placeholder="เช่น SUMMER20" style={{ width: '100%', padding: '12px 16px', border: '1px solid #E8E1D9', borderRadius: '12px', outline: 'none', color: '#5C4E43', fontSize: '14px', textTransform: 'uppercase' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8C7A6B', marginBottom: '6px' }}>ประเภทส่วนลด</label>
                    <select value={formData.discountType} onChange={(e) => setFormData({ ...formData, discountType: e.target.value })} style={{ width: '100%', padding: '12px 16px', border: '1px solid #E8E1D9', borderRadius: '12px', outline: 'none', color: '#5C4E43', fontSize: '14px', backgroundColor: '#ffffff' }}>
                      <option value="percentage">ลดเป็นเปอร์เซ็นต์ (%)</option>
                      <option value="fixed">ลดเป็นจำนวนเงิน (฿)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8C7A6B', marginBottom: '6px' }}>รายละเอียดโปรโมชั่น</label>
                  <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required placeholder="เช่น ลด 20% สำหรับซื้อรองเท้าทั้งหมด" style={{ width: '100%', padding: '12px 16px', border: '1px solid #E8E1D9', borderRadius: '12px', outline: 'none', color: '#5C4E43', fontSize: '14px' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8C7A6B', marginBottom: '6px' }}>ค่าส่วนลด</label>
                    <input type="number" value={formData.discountValue} onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })} required step="0.01" style={{ width: '100%', padding: '12px 16px', border: '1px solid #E8E1D9', borderRadius: '12px', outline: 'none', color: '#5C4E43', fontSize: '14px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8C7A6B', marginBottom: '6px' }}>ลดได้สูงสุด (฿)</label>
                    <input type="number" value={formData.maxDiscount} onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })} placeholder="ไม่จำกัด" step="0.01" style={{ width: '100%', padding: '12px 16px', border: '1px solid #E8E1D9', borderRadius: '12px', outline: 'none', color: '#5C4E43', fontSize: '14px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8C7A6B', marginBottom: '6px' }}>จำนวนสิทธิ์ใช้งาน</label>
                    <input type="number" value={formData.maxUses} onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })} placeholder="ไม่จำกัด" style={{ width: '100%', padding: '12px 16px', border: '1px solid #E8E1D9', borderRadius: '12px', outline: 'none', color: '#5C4E43', fontSize: '14px' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8C7A6B', marginBottom: '6px' }}>ยอดสั่งซื้อขั้นต่ำ (฿)</label>
                    <input type="number" value={formData.minimumOrderAmount} onChange={(e) => setFormData({ ...formData, minimumOrderAmount: e.target.value })} placeholder="ไม่มีขั้นต่ำ" step="0.01" style={{ width: '100%', padding: '12px 16px', border: '1px solid #E8E1D9', borderRadius: '12px', outline: 'none', color: '#5C4E43', fontSize: '14px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8C7A6B', marginBottom: '6px' }}>ยอดสั่งซื้อสูงสุด (฿)</label>
                    <input type="number" value={formData.maximumOrderAmount} onChange={(e) => setFormData({ ...formData, maximumOrderAmount: e.target.value })} placeholder="ไม่จำกัด" step="0.01" style={{ width: '100%', padding: '12px 16px', border: '1px solid #E8E1D9', borderRadius: '12px', outline: 'none', color: '#5C4E43', fontSize: '14px' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8C7A6B', marginBottom: '6px' }}>วันที่เริ่ม</label>
                    <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} style={{ width: '100%', padding: '12px 16px', border: '1px solid #E8E1D9', borderRadius: '12px', outline: 'none', color: '#5C4E43', fontSize: '14px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8C7A6B', marginBottom: '6px' }}>วันสิ้นสุด</label>
                    <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} style={{ width: '100%', padding: '12px 16px', border: '1px solid #E8E1D9', borderRadius: '12px', outline: 'none', color: '#5C4E43', fontSize: '14px' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.isFlashSale} onChange={(e) => setFormData({ ...formData, isFlashSale: e.target.checked })} style={{ width: '18px', height: '18px', accentColor: '#8C7A6B' }} />
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#5C4E43' }}>เปิด Flash Sale</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} style={{ width: '18px', height: '18px', accentColor: '#6D8C7A' }} />
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#5C4E43' }}>เปิดใช้งานโค้ดนี้</span>
                  </label>
                </div>

              </form>
            </div>

            <div style={{ padding: '20px 32px', borderTop: '1px solid #E8E1D9', backgroundColor: '#F8F6F3', display: 'flex', gap: '12px' }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: '14px', border: '1px solid #8C7A6B', color: '#8C7A6B', backgroundColor: '#ffffff', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>
                ยกเลิก
              </button>
              <button type="submit" form="promoForm" style={{ flex: 1, padding: '14px', border: 'none', backgroundColor: '#8C7A6B', color: '#ffffff', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>
                {editingId ? 'บันทึกการเปลี่ยนแปลง' : 'ยืนยันการเพิ่มโปรโมชั่น'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ==========================================
          Modal: ยืนยันการลบ
          ========================================== */}
      {deleteId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(92, 78, 67, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', width: '100%', maxWidth: '400px', borderRadius: '24px', border: '1px solid #E8E1D9', padding: '32px', textAlign: 'center', boxShadow: '0 10px 30px rgba(92, 78, 67, 0.15)' }}>
            <span style={{ fontSize: '32px', display: 'block', marginBottom: '16px' }}>⚠️</span>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 12px 0', color: '#5C4E43' }}>ยืนยันลบโปรโมชั่น</h3>
            <p style={{ fontSize: '14px', color: '#8C7A6B', lineHeight: '1.5', margin: '0 0 24px 0' }}>แน่ใจใช่หรือไม่ที่จะลบโปรโมชั่นนี้? การกระทำนี้ไม่สามารถยกเลิกได้</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: '14px', border: '1px solid #8C7A6B', color: '#8C7A6B', backgroundColor: '#ffffff', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer' }}>ยกเลิก</button>
              <button onClick={() => handleDelete(deleteId)} style={{ flex: 1, padding: '14px', border: 'none', backgroundColor: '#d97777', color: '#ffffff', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer' }}>ลบถาวร</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManagePromotions;