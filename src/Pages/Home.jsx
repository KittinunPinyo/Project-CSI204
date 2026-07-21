import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Home({ filteredProducts, currentUser, handleAddToCart, wishlist, toggleWishlist }) {
  const navigate = useNavigate();
  const [selectedBrand, setSelectedBrand] = useState('ทั้งหมด');
  const [maxPrice, setMaxPrice] = useState(20000);

  const availableBrands = ['ทั้งหมด', ...new Set(filteredProducts.map(p => p.brand).filter(Boolean))];

  const displayProducts = filteredProducts.filter(product => {
    const matchBrand = selectedBrand === 'ทั้งหมด' || product.brand === selectedBrand;
    const matchPrice = Number(product.price) <= maxPrice;
    return matchBrand && matchPrice;
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

  return (
    <div style={{ backgroundColor: '#F8F6F3', minHeight: '100vh', paddingBottom: '50px' }}>
      <div className="container py-5">
        <h2 className="fw-bold mb-2" style={{ color: '#5C4E43' }}>ค้นพบสไตล์ของคุณ</h2>
        <p className="mb-4" style={{ color: '#8C7A6B' }}>สินค้าแบรนด์แท้ 100% พร้อมจัดส่ง</p>

        {/* ==========================================
            แถบตัวกรอง (Filter Bar) - จัดกลุ่มใหม่ให้ราคาชิดซ้าย
            ========================================== */}
        <div className="p-4 rounded-4 mb-4 d-flex align-items-center justify-content-between flex-wrap shadow-sm bg-white" style={{ border: '1px solid #E8E1D9', gap: '20px' }}>
          
          {/* 🌟 จัดกลุ่ม 1 (แบรนด์) และ 2 (ราคา) ให้อยู่ฝั่งซ้ายด้วยกัน */}
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

            {/* 2. ส่วนเลื่อนราคา (ตอนนี้จะอยู่ชิดซ้ายตามแบรนด์แล้ว) */}
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

          {/* 🌟 3. สรุปจำนวนสินค้า (ผลักมาอยู่ฝั่งขวาสุด) */}
          <div className="small fw-bold text-nowrap" style={{ color: '#8C7A6B' }}>
            พบสินค้า {displayProducts.length} รายการ
          </div>

        </div>
        {/* ========================================== */}

        <div className="row g-4">
          {displayProducts.length > 0 ? (
            displayProducts.map(product => {
              const isLiked = wishlist && wishlist.find(w => w.id === product.id);
              return (
                <div key={product.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                  <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden bg-white">
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
                      <div className="mb-2">
                        {Number(product.discountValue ?? product.discount_value ?? 0) > 0 ? (
                          <div>
                            <span style={{ fontSize: '12px', textDecoration: 'line-through', color: '#A69B91', marginRight: '8px' }}>฿{Number(product.price).toLocaleString()}</span>
                            <span style={{ fontSize: '16px', fontWeight: '900', color: '#d97777' }}>฿{getProductDisplayPrice(product).toLocaleString()}</span>
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
    </div>
  );
}