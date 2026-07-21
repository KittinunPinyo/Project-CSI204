import React, { useState, useEffect } from 'react';

export default function ProductDiscountManager({ product, onClose, onSave }) {
  const [discountType, setDiscountType] = useState('fixed');
  const [discountValue, setDiscountValue] = useState(0);

  useEffect(() => {
    if (product) {
      setDiscountType(product.discountType || product.discount_type || 'fixed');
      setDiscountValue(Number(product.discountValue ?? product.discount_value ?? 0));
    }
  }, [product]);

  if (!product) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '520px', backgroundColor: '#ffffff', borderRadius: '20px', boxShadow: '0 20px 50px rgba(0,0,0,0.12)', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '20px', margin: 0, color: '#5C4E43' }}>ตั้งส่วนลดสินค้า</h2>
            <div style={{ fontSize: '13px', color: '#8C7A6B', marginTop: '6px' }}>{product.name || product.name}</div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '24px', lineHeight: '1', cursor: 'pointer', color: '#8C7A6B' }}>×</button>
        </div>

        <div style={{ display: 'grid', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#5C4E43' }}>ชนิดส่วนลด</label>
            <select value={discountType} onChange={e => setDiscountType(e.target.value)} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #E8E1D9', outline: 'none', color: '#5C4E43' }}>
              <option value="fixed">ลดเป็นบาท</option>
              <option value="percentage">ลดเป็นเปอร์เซ็นต์</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#5C4E43' }}>มูลค่าส่วนลด</label>
            <input
              type="number"
              min="0"
              value={discountValue}
              onChange={e => setDiscountValue(e.target.value)}
              style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #E8E1D9', outline: 'none', color: '#5C4E43' }}
              placeholder={discountType === 'percentage' ? 'เช่น 15' : 'เช่น 300'}
            />
            <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#8C7A6B' }}>
              {discountType === 'percentage'
                ? 'เช่น กรอก 20 เพื่อให้ลด 20%'
                : 'เช่น กรอก 250 เพื่อให้ลด 250 บาท'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '14px 0', borderRadius: '14px', border: '1px solid #E8E1D9', backgroundColor: '#F8F6F3', color: '#5C4E43', fontWeight: '700', cursor: 'pointer' }}>
              ยกเลิก
            </button>
            <button type="button" onClick={() => onSave({ discountType, discountValue: Number(discountValue || 0) })} style={{ flex: 1, padding: '14px 0', borderRadius: '14px', border: 'none', backgroundColor: '#8C7A6B', color: '#ffffff', fontWeight: '700', cursor: 'pointer' }}>
              บันทึกส่วนลด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
