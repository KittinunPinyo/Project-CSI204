import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PromotionsList from '../components/PromotionsList';

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

  return (
    <div style={{ backgroundColor: '#F8F6F3', minHeight: '100vh', paddingBottom: '50px' }}>
      <div className="container py-5">
        <h2 className="fw-bold mb-2" style={{ color: '#5C4E43' }}>ค้นพบสไตล์ของคุณ</h2>
        <p className="mb-4" style={{ color: '#8C7A6B' }}>สินค้าแบรนด์แท้ 100% พร้อมจัดส่ง</p>

        {/* แถบตัวกรอง (Filter Bar) โทนสีครีม/น้ำตาล */}
        <div className="p-4 rounded-4 mb-4 d-flex align-items-center gap-4 flex-wrap shadow-sm bg-white" style={{ border: '1px solid #E8E1D9' }}>
          <div className="d-flex align-items-center gap-2">
            <label className="fw-bold mb-0" style={{ color: '#5C4E43' }}>แบรนด์:</label>
            <select className="form-select form-select-sm w-auto border-0 fw-bold rounded-pill px-3" style={{ backgroundColor: '#F8F6F3', color: '#8C7A6B' }} value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)}>
              {availableBrands.map((brand, index) => <option key={index} value={brand}>{brand}</option>)}
            </select>
          </div>

          <div className="d-flex align-items-center gap-3 flex-grow-1">
            <label className="fw-bold mb-0 text-nowrap" style={{ color: '#5C4E43' }}>ราคาไม่เกิน: ฿{maxPrice.toLocaleString()}</label>
            <input type="range" className="form-range" min="0" max="50000" step="500" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} style={{ maxWidth: '300px', accentColor: '#8C7A6B' }} />
          </div>

          <div className="small fw-bold" style={{ color: '#8C7A6B' }}>พบสินค้า {displayProducts.length} รายการ</div>
        </div>

        <div className="mb-4"><PromotionsList /></div>

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
                      <h6 className="fw-bold mt-auto mb-3" style={{ color: '#5C4E43' }}>฿{Number(product.price).toLocaleString()}</h6>
                      <button className="btn w-100 rounded-pill fw-bold text-white" style={{ backgroundColor: '#8C7A6B', fontSize: '12px', padding: '10px' }} onClick={() => navigate(`/product/${product.id}`)}>ดูสินค้า</button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-5" style={{ color: '#8C7A6B' }}><h4>ไม่พบสินค้า</h4></div>
          )}
        </div>
      </div>
    </div>
  );
}