import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Home({ filteredProducts, currentUser, handleAddToCart, wishlist, toggleWishlist }) {
  const navigate = useNavigate();
  const [selectedBrand, setSelectedBrand] = useState('ทั้งหมด');
  const [maxPrice, setMaxPrice] = useState(20000);
  const [promotions, setPromotions] = useState([]);
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const [showFlashSaleOnly, setShowFlashSaleOnly] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);

  const availableBrands = ['ทั้งหมด', ...new Set(filteredProducts.map(p => p.brand).filter(Boolean))];

  const displayProducts = filteredProducts.filter(product => {
    const matchBrand = selectedBrand === 'ทั้งหมด' || product.brand === selectedBrand;
    const matchPrice = Number(product.price) <= maxPrice;
    const hasDiscount = Number(product.discountValue ?? product.discount_value ?? 0) > 0;
    const matchFlashSale = !showFlashSaleOnly || hasDiscount;
    return matchBrand && matchPrice && matchFlashSale;
  });

  const getProductDisplayPrice = (product) => {
    const base = Number(product.price) || 0;
    const type = product.discountType || product.discount_type || 'fixed';
    const value = Number(product.discountValue ?? product.discount_value ?? 0);
    if (type === 'percentage' && value > 0) {
      return Math.max(0, Math.round(base * (1 - value / 100)));
    }
    return Math.max(0, Math.round(base - value));
  };

  // ดึงข้อมูลโปรโมชั่นจาก API
  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/promotions');
        const activePromos = response.data.filter(p => {
          const discountVal = Number(p.discount_value ?? 0);
          return discountVal > 0;
        });
        setPromotions(activePromos);
      } catch (error) {
        console.error('Error fetching promotions:', error);
      }
    };
    fetchPromotions();
  }, []);

  // Auto-rotate promotion banner ทุก 5 วินาที
  useEffect(() => {
    if (promotions.length === 0) return;
    const interval = setInterval(() => {
      setCurrentPromoIndex((prev) => (prev + 1) % promotions.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [promotions.length]);

  return (
    <div style={{ backgroundColor: '#F8F6F3', minHeight: '100vh', paddingBottom: '50px' }}>
      <div className="container py-5">
        <h2 className="fw-bold mb-2" style={{ color: '#5C4E43' }}>ค้นพบสไตล์ของคุณ</h2>
        <p className="mb-4" style={{ color: '#8C7A6B' }}>สินค้าแบรนด์แท้ 100% พร้อมจัดส่ง</p>

        {/* ==========================================
            🌟 แบนเนอร์โปรโมชั่น (สลับขึ้นมาอยู่บนสุด)
            ========================================== */}
        {promotions.length > 0 && (
          <div className="card border-0 shadow-sm overflow-hidden mb-4" style={{ borderRadius: '24px', backgroundColor: '#ffffff' }}>
            <div className="row g-0 align-items-stretch">
              
              {/* ด้านซ้าย: พื้นสีขาว */}
              <div className="col-md-7 p-4 p-lg-5 position-relative d-flex flex-column justify-content-center bg-white" style={{ zIndex: 1 }}>
                
                <div className="d-flex align-items-center gap-3 mb-3">
                  <span className="badge rounded-pill shadow-sm" style={{ 
                    background: 'linear-gradient(135deg, #E68B7D 0%, #d8685c 100%)', 
                    color: '#ffffff', padding: '8px 16px', fontSize: '12px', fontWeight: 'bold' 
                  }}>
                    {promotions[currentPromoIndex]?.is_flash_sale ? '⚡ FLASH SALE' : '🔥 HOT DEAL'}
                  </span>
                  <span className="fw-bold" style={{ fontSize: '14px', color: '#8C7A6B' }}>
                    โปรโมชั่นพิเศษ วันนี้ที่นี่
                  </span>
                </div>

                <h2 className="mb-4 text-uppercase" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', color: '#5C4E43', fontWeight: '900', letterSpacing: '-1.5px', margin: 0 }}>
                  {promotions[currentPromoIndex]?.code || 'PROMO CODE'}
                </h2>

                <div className="mb-4 mt-2">
                  <button
                    className="btn rounded-pill px-4 py-2 fw-bold d-inline-flex align-items-center gap-2"
                    style={{ backgroundColor: '#F4EFEA', color: '#5C4E43', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                    onClick={() => setShowPromoModal(true)}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#E8E1D9'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#F4EFEA'}
                  >
                    <span style={{ fontSize: '16px' }}>📋</span> ดูโค้ดส่วนลดทั้งหมด
                  </button>
                </div>

                <p className="fw-bold mb-4" style={{ fontSize: '16px', color: '#5C4E43', lineHeight: '1.6' }}>
                  {promotions[currentPromoIndex]?.description || 'พิเศษโปรโมชั่นซื้อสินค้าครบลดพิเศษ'}
                </p>

                <div className="d-flex gap-3 mt-auto">
                  <button 
                    className="btn rounded-pill px-4 py-3 fw-bold shadow-sm"
                    style={{ backgroundColor: '#8C7A6B', color: '#ffffff', transition: 'all 0.2s', fontSize: '15px' }}
                    onClick={() => {
                      setShowFlashSaleOnly(!showFlashSaleOnly);
                      setTimeout(() => {
                        document.querySelector('.products-section')?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#5C4E43'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#8C7A6B'}
                  >
                    {showFlashSaleOnly ? 'ดูสินค้าทั้งหมด' : 'ดูสินค้าพิเศษ \u2192'}
                  </button>
                </div>
              </div>

              {/* ด้านขวา: พื้นสีขาวพร้อมไอคอนสายฟ้าตรงกลาง */}
              <div className="col-md-5 p-4 p-lg-5 d-flex align-items-center justify-content-center position-relative bg-white" style={{ zIndex: 2 }}>
                
                {/* ⚡ สายฟ้าตรงกลาง */}
                <div className="position-absolute d-none d-md-block translate-middle" style={{ 
                  left: '0%', top: '50%', zIndex: 10,
                  fontSize: '11rem', lineHeight: 1,
                  background: 'linear-gradient(180deg, #FDBA53 0%, #F5705E 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(2px 4px 6px rgba(245, 112, 94, 0.3))',
                  userSelect: 'none'
                }}>
                  ⚡
                </div>

                {/* การ์ดโค้ดส่วนลด */}
                <div className="card w-100 shadow-sm text-center position-relative" style={{ 
                  backgroundColor: '#ffffff', 
                  borderRadius: '16px', 
                  padding: '40px 20px', 
                  border: '1px solid #8C7A6B',
                  maxWidth: '320px',
                  zIndex: 11
                }}>
                  <div className="small fw-bold mb-3 text-uppercase" style={{ color: '#8C7A6B', letterSpacing: '2px', fontSize: '13px' }}>
                    {promotions[currentPromoIndex]?.code || 'PROMO CODE'}
                  </div>
                  <div className="mb-3" style={{ fontSize: 'clamp(2.5rem, 4vw, 3rem)', color: '#d8685c', fontWeight: '900', letterSpacing: '-1px' }}>
                    {promotions[currentPromoIndex]?.discount_type === 'percentage' 
                      ? `${promotions[currentPromoIndex]?.discount_value}%` 
                      : `฿${Number(promotions[currentPromoIndex]?.discount_value).toLocaleString('th-TH')}`
                    }
                  </div>
                  <div className="fw-bold" style={{ color: '#8C7A6B', fontSize: '14px' }}>
                    ลดราคา
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}
        {/* ========================================== */}

        {/* ==========================================
            แถบตัวกรอง (Filter Bar) - ย้ายมาไว้ด้านล่างแบนเนอร์
            ========================================== */}
        <div className="p-4 rounded-4 mb-4 d-flex align-items-center justify-content-between flex-wrap shadow-sm bg-white" style={{ border: '1px solid #E8E1D9', gap: '20px' }}>
          <div className="d-flex align-items-center flex-wrap" style={{ gap: '40px', flex: 1 }}>
            
            {/* 1. ส่วนเลือกแบรนด์ */}
            <div className="d-flex align-items-center gap-3">
              <label className="fw-bold mb-0 text-nowrap" style={{ color: '#5C4E43' }}>แบรนด์:</label>
              <select 
                className="form-select form-select-sm border-0 fw-bold rounded-pill px-3 py-2 shadow-none" 
                style={{ backgroundColor: '#F8F6F3', color: '#8C7A6B', cursor: 'pointer', minWidth: '120px' }} 
                value={selectedBrand} 
                onChange={(e) => setSelectedBrand(e.target.value)}
              >
                {availableBrands.map((brand, index) => <option key={index} value={brand}>{brand}</option>)}
              </select>
            </div>

            {/* 2. ส่วนเลื่อนราคา */}
            <div className="d-flex align-items-center gap-3" style={{ minWidth: '250px', maxWidth: '400px', flex: 1 }}>
              <label className="fw-bold mb-0 text-nowrap" style={{ color: '#5C4E43' }}>ราคาไม่เกิน: ฿{maxPrice.toLocaleString()}</label>
              <input 
                type="range" 
                className="form-range w-100" 
                min="0" max="50000" step="500" 
                value={maxPrice} 
                onChange={(e) => setMaxPrice(Number(e.target.value))} 
                style={{ accentColor: '#8C7A6B' }} 
              />
            </div>
          </div>

          {/* 3. สรุปจำนวนสินค้า */}
          <div className="small fw-bold text-nowrap" style={{ color: '#8C7A6B' }}>
            พบสินค้า {displayProducts.length} รายการ
          </div>
        </div>
        {/* ========================================== */}

        <div className="row g-4 products-section">
          {displayProducts.length > 0 ? (
            displayProducts.map(product => {
              const isLiked = wishlist && wishlist.find(w => w.id === product.id);
              return (
                <div key={product.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                  <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden bg-white">
                    <div className="position-absolute" style={{ top: '10px', left: '10px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {Number(product.discountValue ?? product.discount_value ?? 0) > 0 && (
                        <span className="badge rounded-pill fw-bold" style={{ backgroundColor: '#d8685c', color: '#ffffff', padding: '6px 12px', fontSize: '11px', whiteSpace: 'nowrap' }}>
                          ⚡ FLASH SALE
                        </span>
                      )}
                    </div>
                    <button className="btn rounded-circle position-absolute border-0" style={{ top: '10px', right: '10px', zIndex: 10, width: '35px', height: '35px', backgroundColor: 'rgba(255,255,255,0.8)' }} onClick={() => toggleWishlist(product)}>
                      {isLiked ? '❤️' : '🤍'}
                    </button>
                    <Link to={`/product/${product.id}`} className="text-decoration-none">
                      <div className="d-flex align-items-center justify-content-center" style={{ height: '220px', backgroundColor: '#F0EBE6' }}>
                        {product.image ? <img src={product.image} alt={product.name} className="w-100 h-100" style={{ objectFit: 'cover' }} /> : <span style={{ color: '#8C7A6B' }}>ไม่มีรูปภาพ</span>}
                      </div>
                    </Link>
                    <div className="card-body d-flex flex-column">
                      <div className="small text-uppercase mb-1" style={{ fontSize: '11px', color: '#8C7A6B' }}>{product.brand || 'No Brand'}</div>
                      <Link to={`/product/${product.id}`} className="text-decoration-none" style={{ color: '#5C4E43' }}><h6 className="fw-bold mb-2">{product.name}</h6></Link>
                      <div className="mb-3 mt-auto">
                        {Number(product.discountValue ?? product.discount_value ?? 0) > 0 ? (
                          <div>
                            <span style={{ fontSize: '12px', textDecoration: 'line-through', color: '#A69B91', marginRight: '8px' }}>฿{Number(product.price).toLocaleString()}</span>
                            <span style={{ fontSize: '16px', fontWeight: '900', color: '#d8685c' }}>฿{getProductDisplayPrice(product).toLocaleString()}</span>
                          </div>
                        ) : (
                          <h6 className="fw-bold mt-0 mb-0" style={{ color: '#5C4E43' }}>฿{Number(product.price).toLocaleString()}</h6>
                        )}
                      </div>
                      <button className="btn w-100 rounded-pill fw-bold text-white" style={{ backgroundColor: '#8C7A6B', fontSize: '12px', padding: '10px' }} onClick={() => navigate(`/product/${product.id}`)}>ดูสินค้า</button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-5" style={{ color: '#8C7A6B' }}><h4>ไม่พบสินค้าที่ตรงกับเงื่อนไข</h4></div>
          )}
        </div>
      </div>

      {/* 🌟 Modal แสดงโค้ดส่วนลดทั้งหมด */}
      {showPromoModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100" style={{ backgroundColor: 'rgba(92,78,67,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="bg-white rounded-4 p-4 shadow-lg" style={{ maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto', border: '1px solid #E8E1D9' }}>
            
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-4">
              <h4 className="fw-bold mb-0" style={{ color: '#5C4E43' }}>💝 โค้ดส่วนลดทั้งหมด</h4>
              <button 
                className="btn btn-close"
                onClick={() => setShowPromoModal(false)}
              ></button>
            </div>

            {/* Promo List */}
            <div className="d-flex flex-column gap-3">
              {promotions.length > 0 ? (
                promotions.map((promo, index) => (
                  <div 
                    key={index} 
                    className="p-3 border rounded-3" 
                    style={{ borderColor: '#E8E1D9', backgroundColor: '#F8F6F3', transition: 'all 0.3s ease' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#ffffff';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                      e.currentTarget.style.transform = 'translateX(5px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#F8F6F3';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div>
                        <h6 className="fw-bold mb-1" style={{ color: '#d8685c' }}>🔥 {promo.code}</h6>
                        <p className="small mb-1 fw-bold" style={{ color: '#8C7A6B' }}>
                          ลดราคา {promo.discount_type === 'percentage' ? promo.discount_value + '%' : '฿' + Number(promo.discount_value).toLocaleString()}
                        </p>
                        <p className="small mb-0" style={{ color: '#5C4E43' }}>
                          {promo.description}
                        </p>
                      </div>
                      <button 
                        className="btn btn-sm fw-bold rounded-pill"
                        style={{ backgroundColor: '#8C7A6B', color: '#ffffff', padding: '8px 16px', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
                        onClick={() => {
                          navigator.clipboard.writeText(promo.code);
                          alert('คัดลอกโค้ด ' + promo.code + ' ไปยัง clipboard แล้ว! ✅');
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#5C4E43'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#8C7A6B'}
                      >
                        📋 คัดลอก
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4" style={{ color: '#8C7A6B' }}>
                  <p className="fw-bold">ยังไม่มีโปรโมชั่นในขณะนี้</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="d-flex gap-2 mt-4">
              <button 
                className="btn rounded-pill w-100 fw-bold"
                style={{ border: '1px solid #8C7A6B', color: '#8C7A6B', backgroundColor: '#ffffff' }}
                onClick={() => setShowPromoModal(false)}
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}