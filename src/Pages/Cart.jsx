import React, { useState, useEffect } from 'react';
import PromotionsList from '../components/PromotionsList';

const API_URL = 'http://localhost:5000/api';

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('PromptPay'); 
  
  const [shippingInfo, setShippingInfo] = useState({
    name: '',
    phone: '',
    country: 'ไทย',
    addressDetail: '',
    subdistrictDistrictProvince: '',
    postalCode: ''
  });
  
  const [checkoutStep, setCheckoutStep] = useState('cart'); // 'cart', 'upload_slip', 'success'
  const [createdOrder, setCreatedOrder] = useState(null);
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [focusedField, setFocusedField] = useState(null);
  const [appliedPromotion, setAppliedPromotion] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  useEffect(() => {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      const parsedCart = JSON.parse(storedCart);
      
      const sanitizedCart = parsedCart.map(item => {
        let rawSize = item.size || item.selectedSize || item.shoeSize || item.euSize;
        if (rawSize && typeof rawSize === 'string') {
          rawSize = rawSize.replace(/EU\s*/i, '').trim();
        }
        return {
          ...item,
          size: rawSize || '42'
        };
      });
      
      setCartItems(sanitizedCart);
      localStorage.setItem('cart', JSON.stringify(sanitizedCart));
    } else {
      setCartItems([]);
    }

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      setShippingInfo(prev => ({
        ...prev,
        name: user.name || ''
      }));
    }
  }, []);

  // Reset discount when cart changes
  useEffect(() => {
    setDiscountAmount(0);
    setAppliedPromotion(null);
  }, [cartItems.length]);

  const subTotal = cartItems.reduce((acc, item) => acc + (item.price * (item.quantity || 1)), 0);
  const shippingFee = subTotal > 0 ? 100 : 0;
  const finalSubtotal = subTotal + shippingFee;
  const totalAmount = Math.max(0, finalSubtotal - (discountAmount || 0));

  const handleApplyPromotion = (validationData) => {
    try {
      // Extract promotion data - could be at different levels
      let promotion = null;
      let discountValue = 0;
      let maxDiscount = 0;

      // Check if discount is directly in validationData
      if (validationData.discountAmount !== undefined) {
        discountValue = Number(validationData.discountAmount) || 0;
        maxDiscount = Number(validationData.max_discount) || 0;
        promotion = validationData;
      }
      // Check if promotion is nested (from API response)
      else if (validationData.promotion) {
        promotion = validationData.promotion;
        if (promotion.discountAmount !== undefined) {
          discountValue = Number(promotion.discountAmount) || 0;
        } else if (promotion.discount_type === 'percentage') {
          const discountPercent = Number(promotion.discount_value) || 0;
          discountValue = (subTotal * discountPercent) / 100;
        } else {
          discountValue = Number(promotion.discount_value) || 0;
        }
        maxDiscount = Number(promotion.max_discount) || 0;
      }

      // Apply max discount limit if specified
      if (maxDiscount > 0 && discountValue > maxDiscount) {
        discountValue = maxDiscount;
      }

      // Set the discount and promotion
      if (discountValue > 0) {
        const finalDiscount = isNaN(discountValue) ? 0 : Math.floor(discountValue);
        setDiscountAmount(finalDiscount);
        setAppliedPromotion({
          ...promotion,
          code: promotion?.code || 'Applied',
          actualDiscount: finalDiscount,
          maxDiscount: maxDiscount
        });
        console.log('Promotion applied! Discount:', finalDiscount, 'Max:', maxDiscount);
      } else {
        console.warn('No valid discount found in:', validationData);
      }
    } catch (err) {
      console.error('Error applying promotion:', err);
      setDiscountAmount(0);
      setAppliedPromotion(null);
    }
  };

  const handleRemoveItem = (id) => {
    const updated = cartItems.filter(item => item.id !== id);
    setCartItems(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setError(null);
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setError('ระบบหลังบ้านรองรับเฉพาะไฟล์รูปภาพหลักฐานสลิป (.png, .jpg, .jpeg) เท่านั้นครับ');
        setSlipFile(null);
        setSlipPreview(null);
        e.target.value = ''; 
        return;
      }
      setSlipFile(file);
      setSlipPreview(URL.createObjectURL(file));
    }
  };

  // ตรวจสอบความถูกต้องของฟอร์ม
  const isPhoneValid = /^[0-9]{10}$/.test(shippingInfo.phone); 
  const isFormValid = 
    shippingInfo.name.trim() !== '' &&
    isPhoneValid &&
    shippingInfo.addressDetail.trim() !== '' &&
    shippingInfo.subdistrictDistrictProvince.trim() !== '' &&
    shippingInfo.postalCode.trim() !== '';

  const handleConfirmOrder = async () => {
    if (cartItems.length === 0) {
      setError('ไม่มีรายการสินค้าในตะกร้าช็อปปิ้งของคุณ');
      return;
    }
    if (!isFormValid) {
      setError('กรุณากรอกข้อมูลที่อยู่จัดส่งและเบอร์โทรศัพท์ (10 หลัก) ให้ครบถ้วนก่อนยืนยันครับ');
      return;
    }

    setLoading(true);
    setError(null);

    // สร้าง Array จัดเก็บรายการสินค้าเพื่อส่งไปให้หลังบ้านใช้ตัดสต๊อก
    const orderItems = cartItems.map(item => ({
      productId: item.id,            
      name: item.name,               
      size: item.size || '42',       
      quantity: item.quantity || 1,  
      price: item.price              
    }));

    const shoeModel = cartItems.map(item => `${item.name} (ไซส์ ${item.size || '42'})`).join(', ');
    const fullAddress = `${shippingInfo.addressDetail}, ${shippingInfo.subdistrictDistrictProvince}, ${shippingInfo.country}, รหัสไปรษณีย์ ${shippingInfo.postalCode}`;

    const orderPayload = {
      customerName: shippingInfo.name,
      customerPhone: shippingInfo.phone,
      customerAddress: fullAddress,
      customerEmail: currentUser?.email || 'guest@kickzone.com',
      shoeModel: shoeModel,
      items: orderItems, // ส่งชุดข้อมูลสินค้ารายตัวไปให้ระบบตัดสต๊อก
      size: cartItems[0]?.size || '42',
      totalAmount: Math.floor(totalAmount),
      discountAmount: Math.floor(discountAmount),
      appliedPromotion: appliedPromotion?.code || null,
      paymentMethod: paymentMethod
    };

    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'ไม่สามารถส่งบันทึกรายการสั่งซื้อเข้าสู่ระบบได้');

      setCreatedOrder(data.order);

      if (paymentMethod === 'PromptPay') {
        setCheckoutStep('upload_slip');
      } else {
        setCheckoutStep('success');
        localStorage.removeItem('cart'); 
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSlip = async (e) => {
    e.preventDefault();
    if (!slipFile) {
      setError('กรุณาเลือกหรืออัปโหลดรูปภาพใบสลิปสำหรับการโอนเงินจริงก่อนกดยืนยันครับ');
      return;
    }
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('slip', slipFile);

    try {
      const response = await fetch(`${API_URL}/orders/${createdOrder.id}/upload-slip`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'กระบวนการส่งและตรวจสอบไฟล์สลิปไม่สำเร็จ');
      }

      setCheckoutStep('success');
      localStorage.removeItem('cart'); 
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (fieldName) => ({
    width: '100%',
    padding: '12px 16px',
    border: focusedField === fieldName ? '1px solid #5C4E43' : '1px solid #E8E1D9',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: '#ffffff',
    color: '#5C4E43',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease-in-out',
    fontFamily: 'inherit'
  });

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#F8F6F3', minHeight: '100vh', padding: '40px 16px', color: '#5C4E43' }}>
      <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
        
        {/* Luxury Progress Navigation Tab */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '48px', borderBottom: '1px solid #E8E1D9', paddingBottom: '24px', gap: '20px' }}>
          <div style={{ textAlign: 'center', position: 'relative' }}>
            <span style={{ fontWeight: '800', color: checkoutStep === 'cart' ? '#5C4E43' : '#B8A99A', fontSize: '15px', display: 'block', paddingBottom: '8px' }}>
              01 / ตะกร้า & ข้อมูลจัดส่ง
            </span>
            {checkoutStep === 'cart' && <div style={{ height: '3px', backgroundColor: '#5C4E43', width: '100%', position: 'absolute', bottom: '-24px', left: 0 }} />}
          </div>
          <span style={{ color: '#E8E1D9', fontSize: '18px', paddingBottom: '8px' }}>→</span>
          <div style={{ textAlign: 'center', position: 'relative' }}>
            <span style={{ fontWeight: '800', color: checkoutStep === 'upload_slip' ? '#5C4E43' : '#B8A99A', fontSize: '15px', display: 'block', paddingBottom: '8px' }}>
              02 / แนบหลักฐานการโอน
            </span>
            {checkoutStep === 'upload_slip' && <div style={{ height: '3px', backgroundColor: '#5C4E43', width: '100%', position: 'absolute', bottom: '-24px', left: 0 }} />}
          </div>
          <span style={{ color: '#E8E1D9', fontSize: '18px', paddingBottom: '8px' }}>→</span>
          <div style={{ textAlign: 'center', position: 'relative' }}>
            <span style={{ fontWeight: '800', color: checkoutStep === 'success' ? '#5C4E43' : '#B8A99A', fontSize: '15px', display: 'block', paddingBottom: '8px' }}>
              03 / ยืนยันการสั่งซื้อสำเร็จ
            </span>
            {checkoutStep === 'success' && <div style={{ height: '3px', backgroundColor: '#5C4E43', width: '100%', position: 'absolute', bottom: '-24px', left: 0 }} />}
          </div>
        </div>

        {/* STEP 1: CART LIST & DELIVERY FORM */}
        {checkoutStep === 'cart' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }} className="grid lg:grid-cols-3">
            
            {/* Left Column: Items list & Delivery forms */}
            <div className="lg:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Product items container */}
              <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #E8E1D9' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 20px 0', color: '#5C4E43', borderBottom: '1px solid #F8F6F3', paddingBottom: '16px' }}>
                  ตะกร้าของคุณ ({cartItems.length} รายการ)
                </h2>
                
                {cartItems.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#8C7A6B' }}>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#5C4E43' }}>ไม่มีสินค้าในตะกร้า</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {cartItems.map((item) => (
                      <div key={item.id} style={{ display: 'flex', gap: '20px', borderBottom: '1px solid #F8F6F3', paddingBottom: '20px', alignItems: 'center' }}>
                        
                        {/* ดึงรูปภาพสินค้ามาแสดงแทนไอคอน */}
                        <div style={{ width: '80px', height: '80px', backgroundColor: '#F8F6F3', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                          {item.imageUrl || item.image ? (
                            <img 
                              src={item.imageUrl || item.image} 
                              alt={item.name} 
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                            />
                          ) : (
                            <span style={{ fontSize: '32px' }}>👟</span>
                          )}
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '800', color: '#5C4E43', fontSize: '14px', textTransform: 'uppercase' }}>{item.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                            <span style={{ fontSize: '13px', color: '#8C7A6B' }}>ไซส์:</span>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#5C4E43', border: '1px solid #E8E1D9', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#ffffff' }}>
                              {item.size || '35.5'}
                            </span>
                          </div>
                        </div>
                        <div style={{ fontWeight: '800', color: '#5C4E43', fontSize: '15px' }}>฿{item.price.toLocaleString()}</div>
                        <button 
                          onClick={() => handleRemoveItem(item.id)}
                          style={{ padding: '6px 12px', border: '1px solid #E8E1D9', backgroundColor: '#ffffff', color: '#8C7A6B', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s ease' }}
                          onMouseEnter={(e) => { e.target.style.backgroundColor = '#F8F6F3'; e.target.style.color = '#5C4E43'; }}
                          onMouseLeave={(e) => { e.target.style.backgroundColor = '#ffffff'; e.target.style.color = '#8C7A6B'; }}
                        >
                          ลบออก
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Delivery destination details */}
              <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #E8E1D9' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#5C4E43', margin: '0 0 20px 0', borderBottom: '1px solid #F8F6F3', paddingBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span></span> ข้อมูลที่อยู่จัดส่งพัสดุ
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* ชื่อ */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#5C4E43', marginBottom: '8px' }}>ชื่อ</label>
                    <input 
                      type="text" 
                      placeholder="ชื่อ-นามสกุล" 
                      value={shippingInfo.name} 
                      onChange={(e) => setShippingInfo({...shippingInfo, name: e.target.value})}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                      style={inputStyle('name')}
                    />
                  </div>

                  {/* เบอร์โทรศัพท์ - Custom Input */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#5C4E43', marginBottom: '8px' }}>เบอร์โทรศัพท์</label>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      border: focusedField === 'phone' ? '1px solid #5C4E43' : '1px solid #E8E1D9',
                      borderRadius: '8px',
                      backgroundColor: '#ffffff',
                      overflow: 'hidden',
                      transition: 'all 0.2s ease-in-out'
                    }}>
                      
                      <input 
                        type="text" 
                        maxLength="10"
                        placeholder="เบอร์โทรศัพท์" 
                        value={shippingInfo.phone} 
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, ''); 
                          setShippingInfo({...shippingInfo, phone: val});
                        }}
                        onFocus={() => setFocusedField('phone')}
                        onBlur={() => setFocusedField(null)}
                        style={{ flex: 1, padding: '12px 16px', border: 'none', outline: 'none', fontSize: '14px', color: '#5C4E43', backgroundColor: 'transparent', fontFamily: 'inherit' }}
                      />

                      {/* Clear Button (X) */}
                      {shippingInfo.phone.length > 0 && (
                        <button 
                          onClick={() => setShippingInfo({...shippingInfo, phone: ''})}
                          style={{ background: 'none', border: 'none', padding: '0 16px', cursor: 'pointer', color: '#8C7A6B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                        </button>
                      )}
                    </div>
                    {/* แจ้งเตือนเมื่อเบอร์โทรไม่ครบ */}
                    {shippingInfo.phone.length > 0 && !isPhoneValid && (
                      <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px', display: 'block' }}>* กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก</span>
                    )}
                  </div>

                  {/* ประเทศ */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#5C4E43', marginBottom: '8px' }}>ประเทศ</label>
                    <select
                      value={shippingInfo.country}
                      onChange={(e) => setShippingInfo({...shippingInfo, country: e.target.value})}
                      onFocus={() => setFocusedField('country')}
                      onBlur={() => setFocusedField(null)}
                      style={{...inputStyle('country'), appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%238C7A6B%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px top 50%', backgroundSize: '10px auto'}}
                    >
                      <option value="ไทย">ไทย</option>
                      <option value="อื่นๆ">อื่นๆ</option>
                    </select>
                  </div>

                  {/* รายละเอียดที่อยู่ */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#5C4E43', marginBottom: '8px' }}>รายละเอียดที่อยู่</label>
                    <input 
                      type="text" 
                      placeholder="รายละเอียดที่อยู่" 
                      value={shippingInfo.addressDetail} 
                      onChange={(e) => setShippingInfo({...shippingInfo, addressDetail: e.target.value})}
                      onFocus={() => setFocusedField('addressDetail')}
                      onBlur={() => setFocusedField(null)}
                      style={inputStyle('addressDetail')}
                    />
                  </div>

                  {/* จังหวัด, เขต/อำเภอ, แขวง/ตำบล */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#5C4E43', marginBottom: '8px' }}>จังหวัด, เขต/อำเภอ, แขวง/ตำบล</label>
                    <input 
                      type="text" 
                      placeholder="จังหวัด, เขต/อำเภอ, แขวง/ตำบล" 
                      value={shippingInfo.subdistrictDistrictProvince} 
                      onChange={(e) => setShippingInfo({...shippingInfo, subdistrictDistrictProvince: e.target.value})}
                      onFocus={() => setFocusedField('subdistrictDistrictProvince')}
                      onBlur={() => setFocusedField(null)}
                      style={inputStyle('subdistrictDistrictProvince')}
                    />
                  </div>

                  {/* รหัสไปรษณีย์ */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#5C4E43', marginBottom: '8px' }}>รหัสไปรษณีย์</label>
                    <input 
                      type="text" 
                      placeholder="รหัสไปรษณีย์" 
                      value={shippingInfo.postalCode} 
                      onChange={(e) => setShippingInfo({...shippingInfo, postalCode: e.target.value})}
                      onFocus={() => setFocusedField('postalCode')}
                      onBlur={() => setFocusedField(null)}
                      style={inputStyle('postalCode')}
                    />
                  </div>

                </div>
              </div>

              {/* Secure Payment methods */}
              <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #E8E1D9' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#5C4E43', margin: '0 0 20px 0', borderBottom: '1px solid #F8F6F3', paddingBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span></span> ช่องทางการชำระเงิน
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    padding: '16px', 
                    border: paymentMethod === 'PromptPay' ? '2px solid #5C4E43' : '1px solid #E8E1D9', 
                    backgroundColor: paymentMethod === 'PromptPay' ? '#F8F6F3' : '#ffffff', 
                    borderRadius: '8px', 
                    cursor: 'pointer', 
                    transition: 'all 0.2s ease' 
                  }}>
                    <input type="radio" checked={paymentMethod === 'PromptPay'} onChange={() => setPaymentMethod('PromptPay')} style={{ accentColor: '#5C4E43', width: '16px', height: '16px' }} />
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#5C4E43' }}>
                       QR CODE (พร้อมเพย์)
                    </span>
                  </label>
                </div>
              </div>

            </div>

            {/* Right Column: Order Pricing Summary */}
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #E8E1D9', height: 'fit-content' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#5C4E43', margin: '0 0 24px 0', borderBottom: '1px solid #F8F6F3', paddingBottom: '16px' }}>
                สรุปรายการสั่งซื้อ
              </h3>

              {/* Promotions Section */}
              <div style={{ marginBottom: '24px' }}>
                <PromotionsList onApplyPromo={handleApplyPromotion} cartTotal={subTotal} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8C7A6B', fontSize: '14px' }}>
                  <span>ยอดรวมสินค้า</span>
                  <span style={{ fontWeight: '800', color: '#5C4E43' }}>฿{isNaN(subTotal) ? '0' : subTotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8C7A6B', fontSize: '14px' }}>
                  <span>ค่าจัดส่งพัสดุ</span>
                  <span style={{ fontWeight: '800', color: '#5C4E43' }}>฿{isNaN(shippingFee) ? '0' : shippingFee.toLocaleString()}</span>
                </div>
                {discountAmount > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderLeft: '3px solid #10b981', paddingLeft: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', fontSize: '14px' }}>
                      <span>ส่วนลดจากโปรโมชั่น</span>
                      <span style={{ fontWeight: '800', color: '#10b981' }}>-฿{isNaN(discountAmount) ? '0' : Math.floor(discountAmount).toLocaleString()}</span>
                    </div>
                    {appliedPromotion?.maxDiscount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0891b2', fontSize: '12px', fontStyle: 'italic' }}>
                        <span>ลดได้สูงสุด</span>
                        <span>฿{Math.floor(appliedPromotion.maxDiscount).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}
                <div style={{ borderTop: '1px dashed #E8E1D9', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#5C4E43' }}>ยอดชำระสุทธิ</span>
                  <span style={{ fontSize: '24px', fontWeight: '900', color: '#5C4E43' }}>฿{isNaN(totalAmount) ? '0' : Math.floor(totalAmount).toLocaleString()}</span>
                </div>
              </div>

              {error && checkoutStep === 'cart' && (
                  <div style={{ padding: '12px', backgroundColor: '#FEF2F2', color: '#DC2626', borderRadius: '8px', marginBottom: '16px', fontSize: '12px', border: '1px solid #FCA5A5' }}>
                    ⚠️ {error}
                  </div>
              )}

              <button 
                onClick={handleConfirmOrder}
                disabled={loading || cartItems.length === 0 || !isFormValid}
                style={{ 
                  width: '100%', 
                  padding: '16px', 
                  backgroundColor: (loading || cartItems.length === 0 || !isFormValid) ? '#D3C9C1' : '#5C4E43', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px', 
                  fontSize: '15px', 
                  fontWeight: '700', 
                  cursor: (loading || cartItems.length === 0 || !isFormValid) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => { if (!loading && cartItems.length > 0 && isFormValid) e.target.style.backgroundColor = '#4A3E35'; }}
                onMouseLeave={(e) => { if (!loading && cartItems.length > 0 && isFormValid) e.target.style.backgroundColor = '#5C4E43'; }}
              >
                {loading ? 'กำลังส่งข้อมูล...' : 'ยืนยันการสั่งซื้อ'}
              </button>
            </div>

          </div>
        )}

        {/* STEP 2: VERIFY TRANSACTION AND UPLOAD SLIP */}
        {checkoutStep === 'upload_slip' && createdOrder && (
          <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: 'white', padding: '40px', borderRadius: '12px', border: '1px solid #E8E1D9' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '40px' }}>🏦</span>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#5C4E43', marginTop: '12px', marginBottom: '8px' }}>
                แนบสลิปเพื่อตรวจสอบข้อมูล
              </h2>
              <p style={{ color: '#8C7A6B', fontSize: '14px', margin: 0 }}>รหัสคำสั่งซื้ออ้างอิง: <strong style={{ color: '#5C4E43' }}>{createdOrder.id}</strong></p>
            </div>

            <div style={{ backgroundColor: '#F8F6F3', borderRadius: '12px', padding: '30px 20px', textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '12px', color: '#8C7A6B', display: 'block', marginBottom: '6px', fontWeight: '600' }}>ยอดเงินสุทธิที่ต้องโอน</span>
              <span style={{ fontSize: '32px', fontWeight: '800', color: '#5C4E43', display: 'block', marginBottom: '20px' }}>฿{createdOrder.totalAmount.toLocaleString()}</span>
              
              <div style={{ width: '220px', height: '220px', backgroundColor: 'white', borderRadius: '8px', padding: '12px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 4px 12px rgba(92, 78, 67, 0.05)' }}>
                <img 
                  src="/QR.png" 
                  alt="PromptPay QR Code" 
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onError={(e) => { e.target.src = 'QR.png'; }}
                />
              </div>
            </div>

            {error && (
              <div style={{ padding: '16px', backgroundColor: '#5C4E43', color: '#ffffff', borderRadius: '8px', marginBottom: '24px', fontWeight: '600', fontSize: '14px' }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleUploadSlip} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#5C4E43', marginBottom: '8px' }}>แนบหลักฐานภาพสลิปโอนเงินจริง (PNG, JPG, JPEG)</label>
                <div style={{ position: 'relative', border: '2px dashed #E8E1D9', borderRadius: '12px', padding: '32px 24px', textAlign: 'center', backgroundColor: '#F8F6F3', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/jpg" 
                    onChange={handleFileChange}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                  />
                  {slipPreview ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <img src={slipPreview} alt="Slip Preview" style={{ maxHeight: '200px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #E8E1D9' }} />
                      <span style={{ fontSize: '13px', color: '#5C4E43', fontWeight: '700' }}>🔄 กดเพื่อเปลี่ยนภาพสลิปใบใหม่</span>
                    </div>
                  ) : (
                    <div>
                      <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px', opacity: 0.7 }}>📸</span>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#5C4E43', display: 'block' }}>คลิกเพื่อเลือกไฟล์รูปภาพใบสลิป</span>
                      <span style={{ fontSize: '12px', color: '#8C7A6B', display: 'block', marginTop: '6px' }}>ขนาดไฟล์รองรับไม่เกิน 5MB</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  type="button"
                  onClick={() => setCheckoutStep('cart')}
                  style={{ flex: 1, padding: '16px', border: '1px solid #E8E1D9', backgroundColor: 'white', color: '#8C7A6B', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onMouseEnter={(e) => { e.target.style.backgroundColor = '#F8F6F3'; e.target.style.color = '#5C4E43'; }}
                  onMouseLeave={(e) => { e.target.style.backgroundColor = 'white'; e.target.style.color = '#8C7A6B'; }}
                >
                  ย้อนกลับ
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  style={{ 
                    flex: 2, 
                    padding: '16px', 
                    backgroundColor: loading ? '#D3C9C1' : '#5C4E43', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '8px', 
                    fontSize: '14px', 
                    fontWeight: '700', 
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => { if (!loading) e.target.style.backgroundColor = '#4A3E35'; }}
                  onMouseLeave={(e) => { if (!loading) e.target.style.backgroundColor = '#5C4E43'; }}
                >
                  {loading ? 'กำลังตรวจสอบสลิป...' : 'ส่งสลิปเพื่อตรวจสอบ'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: ORDER PLACED SUCCESSFULLY */}
        {checkoutStep === 'success' && createdOrder && (
          <div style={{ maxWidth: '550px', margin: '40px auto 0 auto', backgroundColor: 'white', padding: '48px 32px', borderRadius: '12px', border: '1px solid #E8E1D9', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', backgroundColor: '#5C4E43', color: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
              <span style={{ fontSize: '36px' }}>✓</span>
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#5C4E43', margin: '0 0 12px 0' }}>สั่งซื้อพัสดุสำเร็จ</h2>
            <p style={{ color: '#8C7A6B', fontSize: '14px', margin: '0 0 32px 0', lineHeight: '1.6' }}>
              รายการชำระเงินและออเดอร์ได้รับการบันทึกแล้ว ทางทีมงาน KickZone กำลังทำการแพ็คพัสดุเตรียมจัดส่งให้คุณอย่างเร็วที่สุดครับ
            </p>

            <div style={{ backgroundColor: '#F8F6F3', border: '1px dashed #E8E1D9', padding: '24px', borderRadius: '8px', marginBottom: '32px' }}>
              <span style={{ fontSize: '12px', color: '#8C7A6B', display: 'block', marginBottom: '6px', fontWeight: '700' }}>รหัสตรวจสอบสถานะจัดส่งพัสดุ</span>
              <span style={{ fontSize: '28px', fontWeight: '800', color: '#5C4E43', letterSpacing: '2px', display: 'block' }}>{createdOrder.id}</span>
              <span style={{ fontSize: '12px', color: '#8C7A6B', display: 'block', marginTop: '12px' }}>* โปรดบันทึกรหัสนี้ไว้เพื่อเช็คสถานะพัสดุของคุณที่หน้าหลัก</span>
            </div>

            <button 
              onClick={() => window.location.href = '/'}
              style={{ padding: '16px 32px', backgroundColor: '#5C4E43', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s ease' }}
              onMouseEnter={(e) => { e.target.style.backgroundColor = '#4A3E35'; }}
              onMouseLeave={(e) => { e.target.style.backgroundColor = '#5C4E43'; }}
            >
              กลับไปช้อปต่อหน้าร้านค้า
            </button>
          </div>
        )}

      </div>
    </div>
  );
}