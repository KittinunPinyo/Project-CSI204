import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PromotionsList = ({ onApplyPromo, cartTotal = 0, isAdmin = false }) => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [promoCode, setPromoCode] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Admin Management State
  const [adminPromotions, setAdminPromotions] = useState([]);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    maxDiscount: null,
    maxUses: null,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    isFlashSale: false,
    is_active: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [adminMessage, setAdminMessage] = useState(null);

  useEffect(() => {
    fetchPromotions();
    if (isAdmin) {
      fetchAdminPromotions();
    }
  }, [isAdmin]);

  const fetchPromotions = async () => {
    try {
      setLoading(false);
      const response = await axios.get('http://localhost:5000/api/promotions');
      setPromotions(response.data);
    } catch (error) {
      console.error('Error fetching promotions:', error);
      setLoading(false);
    }
  };

  const fetchAdminPromotions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/promotions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdminPromotions(response.data);
    } catch (error) {
      console.error('Error fetching admin promotions:', error);
      setAdminMessage({ type: 'error', text: 'ไม่สามารถดึงข้อมูลโปรโมชั่น' });
    }
  };

  const handleValidatePromo = async (cartTotal = 0) => {
    if (!promoCode.trim()) {
      setValidationResult({ error: 'กรุณากรอกรหัสโปรโมชั่น' });
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/promotions/validate', {
        code: promoCode,
        cartTotal: cartTotal
      });

      setValidationResult(response.data);
      if (response.data.success && onApplyPromo) {
        onApplyPromo(response.data);
      }
    } catch (error) {
      setValidationResult({
        error: error.response?.data?.error || 'โปรโมชั่นไม่ถูกต้อง'
      });
    }
  };

  const applyCoupon = (code) => {
    setPromoCode(code);
    handleValidatePromo(cartTotal);
  };

  // 🌟 ฟังก์ชันเสริมสำหรับคัดลอกโค้ดจากแบนเนอร์
  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setPromoCode(code);
    setIsExpanded(true);
    alert(`คัดลอกโค้ด ${code} เรียบร้อยแล้ว!`);
  };

  // Admin Functions
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmitPromo = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      const url = editingId 
        ? `http://localhost:5000/api/admin/promotions/${editingId}`
        : 'http://localhost:5000/api/admin/promotions';
      
      const method = editingId ? 'put' : 'post';
      
      const dataToSend = {
        ...formData,
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
        maxUses: formData.maxUses ? Number(formData.maxUses) : null
      };

      await axios({
        method,
        url,
        data: dataToSend,
        headers: { Authorization: `Bearer ${token}` }
      });

      setAdminMessage({ type: 'success', text: editingId ? 'แก้ไขโปรโมชั่นสำเร็จ' : 'สร้างโปรโมชั่นสำเร็จ' });
      resetForm();
      fetchAdminPromotions();
      fetchPromotions(); // ดึงโปรใหม่มาโชว์ที่แบนเนอร์ด้วย
    } catch (error) {
      setAdminMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'เกิดข้อผิดพลาด' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditPromo = (promo) => {
    setFormData({
      code: promo.code,
      description: promo.description,
      discountType: promo.discount_type,
      discountValue: promo.discount_value,
      maxDiscount: promo.max_discount || null,
      maxUses: promo.max_uses,
      startDate: promo.start_date?.split('T')[0] || '',
      endDate: promo.end_date?.split('T')[0] || '',
      isFlashSale: promo.is_flash_sale || false,
      is_active: promo.is_active
    });
    setEditingId(promo.id);
    setShowAdminForm(true);
  };

  const handleDeletePromo = async (id) => {
    if (!window.confirm('ยืนยันการลบโปรโมชั่นนี้?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/promotions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdminMessage({ type: 'success', text: 'ลบโปรโมชั่นสำเร็จ' });
      fetchAdminPromotions();
      fetchPromotions();
    } catch (error) {
      setAdminMessage({ type: 'error', text: 'ไม่สามารถลบโปรโมชั่น' });
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: 0,
      maxDiscount: null,
      maxUses: null,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      isFlashSale: false,
      is_active: true
    });
    setEditingId(null);
    setShowAdminForm(false);
  };

  // ดึงโปรโมชั่นตัวแรกมาแสดงที่แบนเนอร์ไฮไลต์
  const topPromo = promotions.length > 0 ? promotions[0] : null;

  return (
    <div style={{ width: '100%' }}>
      
      {/* ==========================================
          Admin Management Section (ปรับโทนสีใหม่)
          ========================================== */}
      {isAdmin && (
        <div style={{ marginBottom: '24px', backgroundColor: '#F8F6F3', border: '2px solid #8C7A6B', borderRadius: '10px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, color: '#5C4E43', fontSize: '16px', fontWeight: '700' }}>⚙️ จัดการโปรโมชั่น</h3>
            <button
              onClick={() => setShowAdminForm(!showAdminForm)}
              style={{
                padding: '8px 16px', backgroundColor: '#8C7A6B', color: '#ffffff',
                border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#5C4E43'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#8C7A6B'}
            >
              {showAdminForm ? '✕ ปิด' : '+ เพิ่มโปรโมชั่น'}
            </button>
          </div>

          {adminMessage && (
            <div style={{
              padding: '10px 12px', borderRadius: '6px', marginBottom: '12px',
              backgroundColor: adminMessage.type === 'success' ? '#F0EBE6' : '#fee2e2',
              color: adminMessage.type === 'success' ? '#5C4E43' : '#991b1b',
              border: `1px solid ${adminMessage.type === 'success' ? '#8C7A6B' : '#fca5a5'}`, fontSize: '13px', fontWeight: 'bold'
            }}>
              {adminMessage.type === 'success' ? '✅' : '❌'} {adminMessage.text}
            </div>
          )}

          {showAdminForm && (
            <form onSubmit={handleSubmitPromo} style={{ backgroundColor: '#ffffff', border: '1px solid #E8E1D9', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <input
                  type="text" name="code" placeholder="รหัสโปรโมชั่น" value={formData.code} onChange={handleFormChange} required
                  style={{ padding: '8px 10px', border: '1px solid #E8E1D9', borderRadius: '4px', fontSize: '13px', fontFamily: 'inherit', color: '#5C4E43' }}
                />
                <select
                  name="discountType" value={formData.discountType} onChange={handleFormChange}
                  style={{ padding: '8px 10px', border: '1px solid #E8E1D9', borderRadius: '4px', fontSize: '13px', fontFamily: 'inherit', color: '#5C4E43' }}
                >
                  <option value="percentage">ร้อยละ (%)</option>
                  <option value="fixed">จำนวนเงิน (฿)</option>
                </select>
              </div>

              <textarea
                name="description" placeholder="รายละเอียดโปรโมชั่น" value={formData.description} onChange={handleFormChange} required
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #E8E1D9', borderRadius: '4px', fontSize: '13px', fontFamily: 'inherit', marginBottom: '12px', minHeight: '60px', color: '#5C4E43' }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <input
                  type="number" name="discountValue" placeholder="ค่าส่วนลด" value={formData.discountValue} onChange={handleFormChange} required step="0.01"
                  style={{ padding: '8px 10px', border: '1px solid #E8E1D9', borderRadius: '4px', fontSize: '13px', fontFamily: 'inherit', color: '#5C4E43' }}
                />
                <input
                  type="number" name="maxDiscount" placeholder="ลดได้สูงสุด (ไม่กำหนด = ปล่อยว่าง)" value={formData.maxDiscount || ''} onChange={handleFormChange} step="0.01"
                  style={{ padding: '8px 10px', border: '1px solid #E8E1D9', borderRadius: '4px', fontSize: '13px', fontFamily: 'inherit', color: '#5C4E43' }}
                />
                <input
                  type="number" name="maxUses" placeholder="จำนวนครั้งสูงสุด (ไม่กำหนด = ปล่อยว่าง)" value={formData.maxUses || ''} onChange={handleFormChange}
                  style={{ padding: '8px 10px', border: '1px solid #E8E1D9', borderRadius: '4px', fontSize: '13px', fontFamily: 'inherit', color: '#5C4E43' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#8C7A6B', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>วันเริ่มต้น</label>
                  <input type="date" name="startDate" value={formData.startDate} onChange={handleFormChange} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E8E1D9', borderRadius: '4px', fontSize: '13px', fontFamily: 'inherit', color: '#5C4E43' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#8C7A6B', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>วันสิ้นสุด (ไม่กำหนด = ปล่อยว่าง)</label>
                  <input type="date" name="endDate" value={formData.endDate} onChange={handleFormChange} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E8E1D9', borderRadius: '4px', fontSize: '13px', fontFamily: 'inherit', color: '#5C4E43' }} />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '12px', padding: '8px 10px', backgroundColor: '#F8F6F3', borderRadius: '4px', borderLeft: '3px solid #8C7A6B' }}>
                <input type="checkbox" name="isFlashSale" checked={formData.isFlashSale} onChange={handleFormChange} style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#8C7A6B' }} />
                <span style={{ fontWeight: '600', color: '#5C4E43' }}>เปิดใช้งาน Flash Sale</span>
              </label>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={resetForm} style={{ padding: '8px 16px', backgroundColor: '#F0EBE6', color: '#8C7A6B', border: '1px solid #E8E1D9', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>ยกเลิก</button>
                <button type="submit" disabled={submitting} style={{ padding: '8px 16px', backgroundColor: '#8C7A6B', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '13px' }}>{editingId ? '💾 บันทึกการแก้ไข' : '➕ สร้างโปรโมชั่น'}</button>
              </div>
            </form>
          )}

          <div>
            <h4 style={{ margin: '12px 0 8px 0', color: '#5C4E43', fontSize: '14px', fontWeight: '900' }}>โปรโมชั่นทั้งหมด ({adminPromotions.length})</h4>
            {adminPromotions.length === 0 ? (
              <p style={{ color: '#8C7A6B', fontSize: '13px', margin: 0 }}>ยังไม่มีโปรโมชั่น</p>
            ) : (
              <div style={{ display: 'grid', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                {adminPromotions.map(promo => (
                  <div key={promo.id} style={{ backgroundColor: '#ffffff', border: `2px solid ${promo.is_active ? '#E8E1D9' : '#fca5a5'}`, borderRadius: '6px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                    <div>
                      <strong style={{ color: '#d97777', fontSize: '14px' }}>{promo.code}</strong>
                      <span style={{ marginLeft: '8px', color: '#8C7A6B', fontWeight: 'bold' }}>
                        {promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `฿${Number(promo.discount_value).toLocaleString('th-TH')}`}
                      </span>
                      {promo.max_discount && (
                        <span style={{ marginLeft: '8px', color: '#5C4E43', fontSize: '11px', fontWeight: '600' }}>(สูงสุด ฿{Number(promo.max_discount).toLocaleString('th-TH')})</span>
                      )}
                      <span style={{ marginLeft: '8px', color: '#8C7A6B', fontSize: '11px' }}>({promo.current_uses || 0}/{promo.max_uses || '∞'})</span>
                      <span style={{ marginLeft: '8px', padding: '2px 6px', borderRadius: '3px', backgroundColor: promo.is_active ? '#F0EBE6' : '#fee2e2', color: promo.is_active ? '#8C7A6B' : '#991b1b', fontSize: '11px', fontWeight: 'bold' }}>
                        {promo.is_active ? '✓ เปิดใช้' : '✕ ปิด'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => handleEditPromo(promo)} style={{ padding: '4px 10px', backgroundColor: '#8C7A6B', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>แก้ไข</button>
                      <button onClick={() => handleDeletePromo(promo.id)} style={{ padding: '4px 10px', backgroundColor: '#d97777', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>ลบ</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          ส่วนของแบนเนอร์แสดงโปรโมชั่น (ดีไซน์ใหม่)
          ========================================== */}
      {!isAdmin && topPromo && (
        <div className="card border-0 shadow-sm overflow-hidden mb-4" style={{ backgroundColor: '#ffffff', borderRadius: '24px' }}>
          <div className="row g-0">
            
            <div className="col-md-7 p-4 p-lg-5 d-flex flex-column justify-content-center">
              <div className="d-flex align-items-center gap-3 mb-3">
                <span className="badge rounded-pill py-2 px-3 shadow-sm" style={{ backgroundColor: '#d97777', color: '#ffffff', fontSize: '12px', fontWeight: 'bold' }}>
                  {topPromo.is_flash_sale ? '⚡ FLASH SALE' : '🔥 HOT DEAL'}
                </span>
                <span className="fw-bold" style={{ color: '#8C7A6B', fontSize: '14px' }}>
                  โปรโมชั่นพิเศษ วันนี้ที่นี่
                </span>
              </div>

              <h1 className="mb-3 text-uppercase" style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', color: '#5C4E43', fontWeight: '900', letterSpacing: '-1px' }}>
                {topPromo.code}
              </h1>

              <div className="mb-4">
                <button 
                  onClick={() => handleCopyCode(topPromo.code)}
                  className="btn rounded-pill px-4 py-2 fw-bold d-inline-flex align-items-center gap-2" 
                  style={{ backgroundColor: '#F0EBE6', color: '#5C4E43', border: '1px solid #E8E1D9', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <span style={{ fontSize: '16px' }}>📋</span> คัดลอกโค้ดส่วนลด
                </button>
              </div>

              <p className="fw-bold mb-4" style={{ color: '#5C4E43', fontSize: '16px', lineHeight: '1.5' }}>
                {topPromo.description}
                {topPromo.max_discount && ` (ลดสูงสุด ฿${Number(topPromo.max_discount).toLocaleString('th-TH')})`}
              </p>
            </div>

            <div className="col-md-5 p-4 p-lg-5 d-flex align-items-center justify-content-center position-relative" style={{ backgroundColor: '#F8F6F3' }}>
              <div className="position-absolute" style={{ fontSize: '12rem', color: '#E8E1D9', opacity: 0.6, right: '-10px', top: '50%', transform: 'translateY(-50%)', zIndex: 0, userSelect: 'none' }}>
                ⚡
              </div>

              <div className="card w-100 border-0 shadow-sm text-center position-relative" style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '40px 20px', zIndex: 1, border: '1px solid #E8E1D9' }}>
                <div className="small fw-bold mb-2 text-uppercase" style={{ color: '#8C7A6B', letterSpacing: '2px' }}>
                  {topPromo.code}
                </div>
                <div className="mb-2" style={{ fontSize: 'clamp(2.5rem, 4vw, 3rem)', color: '#d97777', fontWeight: '900', letterSpacing: '-1px' }}>
                  {topPromo.discount_type === 'percentage' ? `${topPromo.discount_value}%` : `฿${Number(topPromo.discount_value).toLocaleString('th-TH')}`}
                </div>
                <div className="fw-bold" style={{ color: '#8C7A6B' }}>
                  ลดราคาให้คุณ
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          Accordion: โปรโมชั่นทั้งหมด & ช่องกรอกโค้ด
          ========================================== */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '2px solid #E8E1D9', transition: 'all 0.2s ease' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>🎉</span>
          <h3 style={{ fontSize: '18px', fontWeight: '900', margin: 0, color: '#5C4E43' }}>
            โปรโมชั่นที่มีทั้งหมด
            <span style={{ display: 'inline-block', marginLeft: '6px', backgroundColor: '#8C7A6B', color: '#ffffff', paddingLeft: '7px', paddingRight: '7px', borderRadius: '50px', fontSize: '13px', fontWeight: '600' }}>
              {promotions.length}
            </span>
          </h3>
        </div>
        <span style={{ fontSize: '16px', color: '#8C7A6B', transition: 'transform 0.3s ease', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
      </div>

      {isExpanded && (
        <div style={{ paddingTop: '20px' }}>
          
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #E8E1D9', borderRadius: '16px', padding: '20px', marginBottom: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <h4 style={{ fontSize: '15px', fontWeight: '900', margin: '0 0 16px 0', color: '#5C4E43' }}>💳 มีรหัสโปรโมชั่นอยู่หรือไม่?</h4>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              <input
                type="text" value={promoCode} placeholder="พิมพ์รหัสโปรโมชั่นที่นี่..."
                onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setValidationResult(null); }}
                style={{ flex: 1, padding: '12px 16px', border: '1px solid #E8E1D9', borderRadius: '50px', fontSize: '14px', fontFamily: 'inherit', color: '#5C4E43', outline: 'none' }}
              />
              <button
                onClick={() => handleValidatePromo(cartTotal)}
                style={{ padding: '10px 24px', backgroundColor: '#5C4E43', color: '#ffffff', border: 'none', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s ease' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#453a31'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#5C4E43'}
              >
                ใช้โปรโมชั่น
              </button>
            </div>

            {validationResult && (
              <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', backgroundColor: validationResult.error ? '#fee2e2' : '#F0EBE6', color: validationResult.error ? '#991b1b' : '#5C4E43', border: `1px solid ${validationResult.error ? '#fca5a5' : '#E8E1D9'}` }}>
                {validationResult.error ? '❌ ' : '✅ '}
                {validationResult.error || validationResult.message}
                {validationResult.promotion && !validationResult.error && (
                  <div style={{ marginTop: '8px', fontSize: '13px', fontWeight: 'normal', color: '#8C7A6B' }}>
                    <div style={{ fontWeight: 'bold' }}>ลดได้: ฿{Number(validationResult.promotion.discountAmount).toLocaleString('th-TH')}</div>
                    {validationResult.promotion.maxDiscount && validationResult.promotion.maxDiscount > 0 && (
                      <div style={{ marginTop: '4px' }}>⚠️ ลดได้สูงสุด: ฿{Number(validationResult.promotion.maxDiscount).toLocaleString('th-TH')}</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {promotions.length === 0 ? (
            <div style={{ backgroundColor: '#F8F6F3', border: '1px dashed #E8E1D9', borderRadius: '16px', padding: '32px', textAlign: 'center' }}>
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '10px' }}>🎁</span>
              <p style={{ color: '#8C7A6B', fontSize: '14px', margin: 0, fontWeight: 'bold' }}>ยังไม่มีโปรโมชั่นในขณะนี้</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {promotions.map((promo) => (
                <div key={promo.id} style={{ backgroundColor: '#ffffff', border: '1px solid #E8E1D9', borderRadius: '16px', padding: '20px', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', borderLeft: '4px solid #8C7A6B' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '16px', fontWeight: '900', color: '#d97777', letterSpacing: '1px' }}>{promo.code}</span>
                        <span style={{ fontSize: '11px', backgroundColor: '#F0EBE6', color: '#8C7A6B', padding: '4px 10px', borderRadius: '50px', fontWeight: 'bold' }}>
                          {promo.discount_type === 'percentage' ? `ลด ${promo.discount_value}%` : `ลด ฿${Number(promo.discount_value).toLocaleString('th-TH')}`}
                        </span>
                      </div>
                      <p style={{ color: '#5C4E43', fontSize: '13px', margin: 0, lineHeight: '1.5', fontWeight: '600' }}>{promo.description}</p>
                      {promo.max_uses && <p style={{ color: '#8C7A6B', fontSize: '11px', margin: '6px 0 0 0', fontWeight: 'bold' }}>เหลือสิทธิ์: {promo.max_uses - promo.current_uses} ครั้ง</p>}
                    </div>
                    <button
                      onClick={() => applyCoupon(promo.code)}
                      style={{ padding: '8px 20px', backgroundColor: '#F8F6F3', color: '#8C7A6B', border: '1px solid #E8E1D9', borderRadius: '50px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap', marginLeft: '16px', transition: 'all 0.2s ease' }}
                      onMouseEnter={(e) => { e.target.style.backgroundColor = '#8C7A6B'; e.target.style.color = '#ffffff'; }}
                      onMouseLeave={(e) => { e.target.style.backgroundColor = '#F8F6F3'; e.target.style.color = '#8C7A6B'; }}
                    >
                      ใช้โค้ดนี้
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PromotionsList;