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
    isActive: true
  });

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
      if (error.response?.status === 403) alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (เฉพาะ Admin)');
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
      isActive: true
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.code || !formData.description || !formData.discountValue) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (editingId) {
        await axios.put(`http://localhost:5000/api/admin/promotions/${editingId}`, formData, config);
        alert('แก้ไขโปรโมชั่นสำเร็จ');
      } else {
        await axios.post('http://localhost:5000/api/admin/promotions', formData, config);
        alert('สร้างโปรโมชั่นสำเร็จ');
      }

      fetchPromotions();
      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || 'เกิดข้อผิดพลาดในการบันทึก');
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
      isActive: promo.is_active
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
      alert('ลบโปรโมชั่นสำเร็จ');
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการลบ');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
        <p style={{ color: '#64748b', fontWeight: '500' }}>กำลังโหลดข้อมูลโปรโมชั่น...</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>🎉</span>
            <h2 style={{ fontSize: '24px', fontWeight: '900', margin: 0, letterSpacing: '0.5px' }}>
              จัดการโปรโมชั่น
            </h2>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: showForm ? '#ef4444' : '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.opacity = '0.9';
              e.target.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.target.style.opacity = '1';
              e.target.style.transform = 'scale(1)';
            }}
          >
            {showForm ? '✕ ยกเลิก' : '➕ เพิ่มโปรโมชั่น'}
          </button>
        </div>
        <p style={{ color: '#64748b', margin: '8px 0 0 0', fontSize: '14px' }}>
          จำนวนโปรโมชั่น: <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{promotions.length}</span> รายการ
        </p>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '11px',
          padding: '20px',
          marginBottom: '28px'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 16px 0', color: '#1e293b' }}>
            {editingId ? '✏️ แก้ไขโปรโมชั่น' : '✍️ สร้างโปรโมชั่นใหม่'}
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              {/* Code */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#475569' }}>
                  รหัสโปรโมชั่น
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="เช่น SAVE20"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontFamily: 'inherit'
                  }}
                  disabled={editingId ? true : false}
                />
              </div>

              {/* Discount Type */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#475569' }}>
                  ประเภทส่วนลด
                </label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="percentage">เปอร์เซ็นต์ (%)</option>
                  <option value="fixed">จำนวนเงินคงที่ (บาท)</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#475569' }}>
                รายละเอียด
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="เช่น ลด 20% สำหรับซื้อรองเท้าทั้งหมด"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              {/* Discount Value */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#475569' }}>
                  ค่าส่วนลด
                </label>
                <input
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                  placeholder="0"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Max Discount */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#475569' }}>
                  ลดได้ไม่เกิน (บาท)
                </label>
                <input
                  type="number"
                  value={formData.maxDiscount}
                  onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                  placeholder="ไม่มีขีดจำกัด"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Max Uses */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#475569' }}>
                  จำนวนครั้งที่ใช้ได้
                </label>
                <input
                  type="number"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                  placeholder="ไม่จำกัด"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Start Date */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#475569' }}>
                  วันเริ่มต้น
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              {/* End Date */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#475569' }}>
                  วันสิ้นสุด (ไม่บังคับ)
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Active Status */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#475569' }}>
                  สถานะ
                </label>
                <select
                  value={formData.isActive ? 'active' : 'inactive'}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="active">✅ ใช้งาน</option>
                  <option value="inactive">⛔ ปิดใช้งาน</option>
                </select>
              </div>

              {/* Flash Sale */}
              <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '4px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569' }}>
                  <input
                    type="checkbox"
                    checked={formData.isFlashSale}
                    onChange={(e) => setFormData({ ...formData, isFlashSale: e.target.checked })}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <span>Flash Sale</span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#e2e8f0',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {editingId ? '💾 บันทึกการแก้ไข' : '➕ สร้างโปรโมชั่น'}
              </button>
            </div>
          </form>
          </div>
        )}

      {promotions.length === 0 ? (
        <div style={{
          backgroundColor: '#f8fafc',
          border: '2px dashed #cbd5e1',
          borderRadius: '12px',
          padding: '56px 28px',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '44px', display: 'block', marginBottom: '14px' }}>🎁</span>
          <p style={{ color: '#64748b', fontSize: '15px', margin: 0 }}>ยังไม่มีโปรโมชั่น</p>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: '8px 0 0 0' }}>ลองคลิกปุ่ม "เพิ่มโปรโมชั่น" เพื่อสร้างโปรโมชั่นใหม่</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '18px' }}>
          {promotions.map((promo) => (
            <div 
              key={promo.id}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '18px',
                transition: 'all 0.3s ease',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '12px' }}>
                {/* Code */}
                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    รหัส
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginTop: '6px', fontFamily: 'monospace', letterSpacing: '1px' }}>
                    {promo.code}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    รายละเอียด
                  </div>
                  <div style={{ fontSize: '13px', color: '#1e293b', marginTop: '6px' }}>
                    {promo.description}
                  </div>
                </div>

                {/* Discount */}
                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    ส่วนลด
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#059669', marginTop: '6px' }}>
                    {promo.discount_type === 'percentage' 
                      ? `${promo.discount_value}%` 
                      : `฿${Number(promo.discount_value).toLocaleString('th-TH')}`}
                  </div>
                </div>
              </div>

              {/* Status & Uses */}
              <div style={{
                backgroundColor: '#f8fafc',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '12px',
                borderLeft: '4px solid #3b82f6',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '12px'
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>สถานะ</div>
                  <div style={{ fontSize: '13px', color: '#1e293b', marginTop: '4px' }}>
                    {promo.is_active ? '✅ ใช้งาน' : '⛔ ปิดใช้งาน'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>ลดได้สูงสุด</div>
                  <div style={{ fontSize: '13px', color: '#059669', marginTop: '4px', fontWeight: '600' }}>
                    {promo.max_discount ? `฿${Number(promo.max_discount).toLocaleString('th-TH')}` : 'ไม่มีขีดจำกัด'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>การใช้งาน</div>
                  <div style={{ fontSize: '13px', color: '#1e293b', marginTop: '4px' }}>
                    {promo.max_uses 
                      ? `${promo.current_uses} / ${promo.max_uses}`
                      : `${promo.current_uses} / ไม่จำกัด`}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>วันสิ้นสุด</div>
                  <div style={{ fontSize: '13px', color: '#1e293b', marginTop: '4px' }}>
                    {promo.end_date ? new Date(promo.end_date).toLocaleDateString('th-TH') : 'ไม่มี'}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => handleEdit(promo)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#3b82f6',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#2563eb';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#3b82f6';
                  }}
                >
                  ✏️ แก้ไข
                </button>
                <button
                  onClick={() => setDeleteId(promo.id)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#dc2626';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#ef4444';
                  }}
                >
                  🗑️ ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '32px',
            maxWidth: '420px',
            width: '100%',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)',
            animation: 'slideUp 0.3s ease'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '48px', display: 'block', marginBottom: '14px' }}>⚠️</span>
              <h3 style={{ fontSize: '18px', fontWeight: '900', margin: '0 0 12px 0', color: '#1e293b' }}>
                ยืนยันการลบโปรโมชั่น
              </h3>
              <p style={{ color: '#64748b', fontSize: '14px', margin: '0', lineHeight: '1.5' }}>
                คุณแน่ใจที่ต้องการลบโปรโมชั่นนี้หรือไม่? การกระทำนี้ไม่สามารถยกเลิกได้
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setDeleteId(null)}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  color: '#475569',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f1f5f9';
                  e.target.style.borderColor = '#94a3b8';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#ffffff';
                  e.target.style.borderColor = '#cbd5e1';
                }}
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: 'none',
                  backgroundColor: '#ef4444',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  color: '#ffffff',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 8px rgba(239, 68, 68, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#dc2626';
                  e.target.style.boxShadow = '0 6px 12px rgba(239, 68, 68, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#ef4444';
                  e.target.style.boxShadow = '0 4px 8px rgba(239, 68, 68, 0.2)';
                }}
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default ManagePromotions;