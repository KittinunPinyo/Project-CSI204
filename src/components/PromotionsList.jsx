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
      
      // แปลงค่าสตริงว่างเป็น null
      const dataToSend = {
        ...formData,
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
        maxUses: formData.maxUses ? Number(formData.maxUses) : null
      };

      const response = await axios({
        method,
        url,
        data: dataToSend,
        headers: { Authorization: `Bearer ${token}` }
      });

      setAdminMessage({ type: 'success', text: editingId ? 'แก้ไขโปรโมชั่นสำเร็จ' : 'สร้างโปรโมชั่นสำเร็จ' });
      resetForm();
      fetchAdminPromotions();
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

  return (
    <div style={{ width: '100%' }}>
      {/* Admin Management Section */}
      {isAdmin && (
        <div style={{ marginBottom: '24px', backgroundColor: '#f0f9ff', border: '2px solid #0284c7', borderRadius: '10px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, color: '#0c4a6e', fontSize: '16px', fontWeight: '700' }}>⚙️ จัดการโปรโมชั่น</h3>
            <button
              onClick={() => setShowAdminForm(!showAdminForm)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '13px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#0369a1'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#0284c7'}
            >
              {showAdminForm ? '✕ ปิด' : '+ เพิ่มโปรโมชั่น'}
            </button>
          </div>

          {adminMessage && (
            <div style={{
              padding: '10px 12px',
              borderRadius: '6px',
              marginBottom: '12px',
              backgroundColor: adminMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
              color: adminMessage.type === 'success' ? '#166534' : '#991b1b',
              border: `1px solid ${adminMessage.type === 'success' ? '#86efac' : '#fca5a5'}`,
              fontSize: '13px'
            }}>
              {adminMessage.type === 'success' ? '✅' : '❌'} {adminMessage.text}
            </div>
          )}

          {showAdminForm && (
            <form onSubmit={handleSubmitPromo} style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e0e7ff',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '12px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <input
                  type="text"
                  name="code"
                  placeholder="รหัสโปรโมชั่น"
                  value={formData.code}
                  onChange={handleFormChange}
                  required
                  style={{
                    padding: '8px 10px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontFamily: 'inherit'
                  }}
                />
                <select
                  name="discountType"
                  value={formData.discountType}
                  onChange={handleFormChange}
                  style={{
                    padding: '8px 10px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontFamily: 'inherit'
                  }}
                >
                  <option value="percentage">ร้อยละ (%)</option>
                  <option value="fixed">จำนวนเงิน (฿)</option>
                </select>
              </div>

              <textarea
                name="description"
                placeholder="รายละเอียดโปรโมชั่น"
                value={formData.description}
                onChange={handleFormChange}
                required
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  marginBottom: '12px',
                  minHeight: '60px'
                }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <input
                  type="number"
                  name="discountValue"
                  placeholder="ค่าส่วนลด"
                  value={formData.discountValue}
                  onChange={handleFormChange}
                  required
                  step="0.01"
                  style={{
                    padding: '8px 10px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontFamily: 'inherit'
                  }}
                />
                <input
                  type="number"
                  name="maxDiscount"
                  placeholder="ลดได้สูงสุด (บาท - ไม่กำหนด = ไม่มีข้อจำกัด)"
                  value={formData.maxDiscount || ''}
                  onChange={handleFormChange}
                  step="0.01"
                  style={{
                    padding: '8px 10px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontFamily: 'inherit'
                  }}
                />
                <input
                  type="number"
                  name="maxUses"
                  placeholder="จำนวนครั้งสูงสุด (ไม่กำหนด = ไม่มีข้อจำกัด)"
                  value={formData.maxUses || ''}
                  onChange={handleFormChange}
                  style={{
                    padding: '8px 10px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>วันเริ่มต้น</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleFormChange}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>วันสิ้นสุด (ไม่กำหนด = ไม่มีวันสิ้นสุด)</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleFormChange}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '12px', padding: '8px 10px', backgroundColor: '#f0f9ff', borderRadius: '4px', borderLeft: '3px solid #0284c7' }}>
                <input
                  type="checkbox"
                  name="isFlashSale"
                  checked={formData.isFlashSale}
                  onChange={handleFormChange}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span style={{ fontWeight: '600', color: '#0c4a6e' }}>เปิดใช้งาน Flash Sale</span>
              </label>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#e2e8f0',
                    color: '#475569',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '13px'
                  }}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    fontSize: '13px'
                  }}
                >
                  {editingId ? '💾 บันทึกการแก้ไข' : '➕ สร้างโปรโมชั่น'}
                </button>
              </div>
            </form>
          )}

          {/* Admin Promotions List */}
          <div>
            <h4 style={{ margin: '12px 0 8px 0', color: '#0c4a6e', fontSize: '14px', fontWeight: '600' }}>
              โปรโมชั่นทั้งหมด ({adminPromotions.length})
            </h4>
            {adminPromotions.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>ยังไม่มีโปรโมชั่น</p>
            ) : (
              <div style={{ display: 'grid', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                {adminPromotions.map(promo => (
                  <div key={promo.id} style={{
                    backgroundColor: '#ffffff',
                    border: `2px solid ${promo.is_active ? '#86efac' : '#fca5a5'}`,
                    borderRadius: '6px',
                    padding: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '12px'
                  }}>
                    <div>
                      <strong style={{ color: '#f59e0b' }}>{promo.code}</strong>
                      <span style={{ marginLeft: '8px', color: '#64748b' }}>
                        {promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `฿${Number(promo.discount_value).toLocaleString('th-TH')}`}
                      </span>
                      {promo.max_discount && (
                        <span style={{ marginLeft: '8px', color: '#ef4444', fontSize: '11px', fontWeight: '600' }}>
                          (สูงสุด ฿{Number(promo.max_discount).toLocaleString('th-TH')})
                        </span>
                      )}
                      <span style={{ marginLeft: '8px', color: '#64748b', fontSize: '11px' }}>
                        ({promo.current_uses || 0}/{promo.max_uses || '∞'})
                      </span>
                      <span style={{
                        marginLeft: '8px',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        backgroundColor: promo.is_active ? '#dcfce7' : '#fee2e2',
                        color: promo.is_active ? '#166534' : '#991b1b',
                        fontSize: '11px'
                      }}>
                        {promo.is_active ? '✓ เปิดใช้' : '✕ ปิด'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleEditPromo(promo)}
                        style={{
                          padding: '4px 10px',
                          backgroundColor: '#3b82f6',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: '600',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleDeletePromo(promo.id)}
                        style={{
                          padding: '4px 10px',
                          backgroundColor: '#ef4444',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: '600',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Header */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 0',
          borderBottom: '2px solid #e2e8f0',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderBottomColor = '#94a3b8';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderBottomColor = '#e2e8f0';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>🎉</span>
          <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#1e293b' }}>
            โปรโมชั่นที่มี
            <span style={{ 
              display: 'inline-block',
              marginLeft: '6px',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              paddingLeft: '7px',
              paddingRight: '7px',
              borderRadius: '3px',
              fontSize: '13px',
              fontWeight: '600'
            }}>
              {promotions.length}
            </span>
          </h3>
        </div>
        <span style={{ fontSize: '16px', transition: 'transform 0.3s ease', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▼
        </span>
      </div>

      {isExpanded && (
        <div style={{ paddingTop: '16px' }}>
          {/* Promo Code Input */}
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '16px',
            marginBottom: '18px'
          }}>
            <h4 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 12px 0', color: '#1e293b' }}>
              💳 มีโปรโมชั่นอยู่หรือไม่?
            </h4>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              <input
                type="text"
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value.toUpperCase());
                  setValidationResult(null);
                }}
                placeholder="ใส่รหัสโปรโมชั่น..."
                style={{
                  flex: 1,
                  padding: '10px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontFamily: 'inherit'
                }}
              />
              <button
                onClick={() => handleValidatePromo(cartTotal)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#000000',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#1e293b';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#000000';
                }}
              >
                ใช้โปรโมชั่น
              </button>
            </div>

            {/* Validation Result */}
            {validationResult && (
              <div style={{
                padding: '10px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                backgroundColor: validationResult.error ? '#fee2e2' : '#dcfce7',
                color: validationResult.error ? '#991b1b' : '#166534',
                border: `1px solid ${validationResult.error ? '#fca5a5' : '#86efac'}`
              }}>
                {validationResult.error ? '❌ ' : '✅ '}
                {validationResult.error || validationResult.message}
                {validationResult.promotion && !validationResult.error && (
                  <div style={{ marginTop: '6px', fontSize: '12px', fontWeight: 'normal' }}>
                    <div>ลดได้: ฿{Number(validationResult.promotion.discountAmount).toLocaleString('th-TH')}</div>
                    {validationResult.promotion.maxDiscount && validationResult.promotion.maxDiscount > 0 && (
                      <div style={{ marginTop: '4px', opacity: 0.8 }}>
                        ⚠️ ลดได้สูงสุด: ฿{Number(validationResult.promotion.maxDiscount).toLocaleString('th-TH')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Promotions List */}
          {promotions.length === 0 ? (
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: '10px',
              padding: '28px',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '10px' }}>🎁</span>
              <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>ยังไม่มีโปรโมชั่นในขณะนี้</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {promotions.map((promo) => (
                <div 
                  key={promo.id}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '12px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                    borderLeft: '4px solid #3b82f6'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#f59e0b', fontFamily: 'monospace', letterSpacing: '1px' }}>
                          {promo.code}
                        </span>
                        <span style={{ 
                          fontSize: '11px', 
                          backgroundColor: promo.discount_type === 'percentage' ? '#dbeafe' : '#fef3c7',
                          color: promo.discount_type === 'percentage' ? '#0c4a6e' : '#92400e',
                          padding: '2px 8px',
                          borderRadius: '3px',
                          fontWeight: '600'
                        }}>
                          {promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `฿${Number(promo.discount_value).toLocaleString('th-TH')}`}
                        </span>
                      </div>
                      <p style={{ color: '#475569', fontSize: '12px', margin: 0, lineHeight: '1.4' }}>
                        {promo.description}
                      </p>
                      {promo.max_uses && (
                        <p style={{ color: '#94a3b8', fontSize: '11px', margin: '4px 0 0 0' }}>
                          เหลือ: {promo.max_uses - promo.current_uses} ครั้ง
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => applyCoupon(promo.code)}
                      style={{
                        padding: '6px 16px',
                        backgroundColor: '#3b82f6',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        marginLeft: '10px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#2563eb';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#3b82f6';
                      }}
                    >
                      ใช้
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