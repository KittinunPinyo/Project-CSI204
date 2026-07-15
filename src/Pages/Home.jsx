import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Home({ filteredProducts, currentUser, handleAddToCart, wishlist, toggleWishlist }) {
  // State สำหรับตัวกรอง
  const [selectedBrand, setSelectedBrand] = useState('ทั้งหมด');
  const [maxPrice, setMaxPrice] = useState(20000);

  // =======================================================
  // 🌟 1. ดึงรายชื่อแบรนด์แบบไดนามิก (Dynamic Brands)
  // =======================================================
  // นำสินค้าทั้งหมดมาดึงเฉพาะชื่อแบรนด์ กรองค่าว่างออก และใช้ Set เพื่อตัดชื่อที่ซ้ำกันทิ้ง
  const availableBrands = ['ทั้งหมด', ...new Set(filteredProducts.map(p => p.brand).filter(Boolean))];

  // =======================================================
  // 🌟 2. กรองสินค้าที่จะแสดงผล (จากช่องค้นหา + Dropdown + ราคา)
  // =======================================================
  const displayProducts = filteredProducts.filter(product => {
    const matchBrand = selectedBrand === 'ทั้งหมด' || product.brand === selectedBrand;
    const matchPrice = Number(product.price) <= maxPrice;
    return matchBrand && matchPrice;
  });

  return (
    <div className="container py-5" style={{ minHeight: '80vh' }}>
      <h2 className="fw-bold mb-2">ค้นพบสไตล์ของคุณ</h2>
      <p className="text-muted mb-4">สินค้าแบรนด์แท้ 100% พร้อมจัดส่ง</p>

      {/* ======================================================= */}
      {/* แถบตัวกรองสินค้า (Filter Bar) */}
      {/* ======================================================= */}
      <div className="bg-light p-3 rounded-4 mb-4 d-flex align-items-center gap-4 flex-wrap shadow-sm">
        
        {/* Dropdown แบรนด์อัตโนมัติ */}
        <div className="d-flex align-items-center gap-2">
          <label className="fw-bold mb-0">แบรนด์:</label>
          <select 
            className="form-select form-select-sm w-auto border-0 fw-bold"
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
          >
            {availableBrands.map((brand, index) => (
              <option key={index} value={brand}>{brand}</option>
            ))}
          </select>
        </div>

        {/* Slider ราคา */}
        <div className="d-flex align-items-center gap-3 flex-grow-1">
          <label className="fw-bold mb-0 text-nowrap">ราคาไม่เกิน: ฿{maxPrice.toLocaleString()}</label>
          <input 
            type="range" 
            className="form-range" 
            min="0" 
            max="50000" 
            step="500"
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            style={{ maxWidth: '300px' }}
          />
        </div>

        <div className="text-muted small fw-bold">
          พบสินค้า {displayProducts.length} รายการ
        </div>
      </div>

      {/* ======================================================= */}
      {/* Grid แสดงรายการสินค้า */}
      {/* ======================================================= */}
      <div className="row g-4">
        {displayProducts.length > 0 ? (
          displayProducts.map(product => {
            const isLiked = wishlist && wishlist.find(w => w.id === product.id);
            
            return (
              <div key={product.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden position-relative">
                  
                  {/* ปุ่มหัวใจ (Wishlist) */}
                  <button 
                    className="btn btn-light rounded-circle position-absolute border-0 shadow-sm" 
                    style={{ top: '10px', right: '10px', zIndex: 10, width: '35px', height: '35px', padding: 0 }}
                    onClick={() => toggleWishlist(product)}
                  >
                    {isLiked ? '❤️' : '🤍'}
                  </button>

                  {/* รูปภาพสินค้า */}
                  <Link to={`/product/${product.id}`} className="text-decoration-none">
                    <div className="bg-light d-flex align-items-center justify-content-center" style={{ height: '220px' }}>
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-100 h-100" style={{ objectFit: 'cover' }} />
                      ) : (
                        <span className="text-muted small">ไม่มีรูปภาพ</span>
                      )}
                    </div>
                  </Link>

                  {/* ข้อมูลสินค้า */}
                  <div className="card-body d-flex flex-column">
                    <div className="text-muted small text-uppercase mb-1" style={{ fontSize: '11px' }}>
                      {product.brand || 'No Brand'}
                    </div>
                    <Link to={`/product/${product.id}`} className="text-decoration-none text-dark">
                      <h6 className="fw-bold mb-2">{product.name}</h6>
                    </Link>
                    <h6 className="text-danger fw-bold mt-auto mb-3">฿{Number(product.price).toLocaleString()}</h6>
                    
                    {/* ปุ่มเพิ่มลงตะกร้า (โชว์เฉพาะ Customer) */}
                    {currentUser === 'customer' && (
                      <button 
                        className="btn btn-dark w-100 rounded-2 fw-bold text-uppercase" 
                        style={{ fontSize: '12px', padding: '10px' }}
                        onClick={() => handleAddToCart(product)}
                      >
                        เพิ่มลงตะกร้า
                      </button>
                    )}
                  </div>

                </div>
              </div>
            );
          })
        ) : (
          <div className="col-12 text-center py-5">
            <h4 className="text-muted fw-bold mb-3">ไม่พบสินค้าที่คุณค้นหา</h4>
            <p className="text-muted">ลองเปลี่ยนคำค้นหา แบรนด์ หรือขยับช่วงราคาดูอีกครั้ง</p>
            <button className="btn btn-outline-dark mt-2" onClick={() => { setSelectedBrand('ทั้งหมด'); setMaxPrice(20000); }}>
              รีเซ็ตตัวกรอง
            </button>
          </div>
        )}
      </div>

    </div>
  );
}