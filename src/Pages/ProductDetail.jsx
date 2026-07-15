import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

export default function ProductDetail({ products, currentUser, handleAddToCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [selectedSize, setSelectedSize] = useState(null);
  const [showDetails, setShowDetails] = useState(true);

  // 🔴 เคลียร์ค่า Size ที่เลือกไว้ทุกครั้งที่เปลี่ยนสินค้า (เปลี่ยนสี)
  useEffect(() => {
    setSelectedSize(null);
  }, [id]);

  // 1. ค้นหาสินค้าปัจจุบันที่กำลังเปิดดูจาก ID
  const product = products.find(p => p.id === id || p.id === Number(id));

  if (!product) {
    return <div className="text-center py-5 mt-5 fw-bold text-muted">กำลังโหลดข้อมูล... หรือไม่พบสินค้านี้</div>;
  }

  // 2. ค้นหาสินค้าสีอื่นๆ ในรุ่นเดียวกัน (อ้างอิงจากชื่อสินค้าที่เหมือนกัน)
  const colorVariants = products.filter(p => p.name === product.name);

  // 3. 🌟 ดึงข้อมูลจริงจากฐานข้อมูล (ที่ Admin กรอกไว้) มาแสดง
  const productDetails = {
    brand: product.brand || '-',
    model: product.name,
    sku: product.sku || '-', // ดึง SKU จริง
    color: product.color || '-', // ดึงสีจริง
    releaseDate: product.releaseDate || '-' // ดึงวันที่จริง
  };

  // 4. 🌟 สร้างตารางไซส์จากข้อมูลสต็อกจริงของสินค้านั้นๆ
  const euSizes = ['35.5', '36', '36.5', '37.5', '38', '38.5', '39.5', '40', '40.5', '41.5', '42', '42.5', '43', '44', '44.5', '45', '45.5', '46.5', '47.5'];
  
  const sizeChart = euSizes.map((size, index) => {
    // เช็คว่าในสต็อกมีไซส์นี้กี่ชิ้น ถ้าไม่มีให้เป็น 0
    const stockCount = product.stock ? Number(product.stock[size] || 0) : 0;
    return {
      id: index + 1,
      EU: size,
      available: stockCount > 0, // ถ้ามากกว่า 0 แปลว่ามีของ กดซื้อได้
      stockLimit: stockCount
    };
  });

  // ฟังก์ชันกดเพิ่มลงตะกร้า
  const onAddToCart = () => {
    if (!selectedSize) {
      alert("กรุณาเลือกไซส์ก่อนเพิ่มลงตะกร้าครับ");
      return;
    }
    const productToAdd = {
      ...product,
      selectedSize: `EU ${selectedSize.EU}`,
      price: product.price 
    };
    handleAddToCart(productToAdd);
  };

  return (
    <div className="container py-5">
      
      <button onClick={() => navigate(-1)} className="btn btn-link text-dark text-decoration-none fw-bold px-0 mb-4">
        &larr; ย้อนกลับ
      </button>

      <div className="row g-5">
        
        {/* ======================================= */}
        {/* ฝั่งซ้าย: รูปภาพสินค้า */}
        {/* ======================================= */}
        <div className="col-lg-7">
          <div className="position-sticky" style={{ top: '20px' }}>
            <div className="bg-light rounded-4 d-flex align-items-center justify-content-center p-4">
              {product.image ? (
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="img-fluid" 
                  style={{ 
                    maxHeight: '400px', 
                    width: '100%',
                    objectFit: 'contain',
                    mixBlendMode: 'multiply'
                  }} 
                />
              ) : (
                <span className="text-muted py-5">ไม่มีรูปภาพ</span>
              )}
            </div>
          </div>
        </div>

        {/* ======================================= */}
        {/* ฝั่งขวา: ข้อมูล ไซส์ และรายละเอียด */}
        {/* ======================================= */}
        <div className="col-lg-5">
          <div className="d-flex flex-column h-100">
            
            <div className="text-muted text-uppercase fw-bold mb-1" style={{ fontSize: '12px', letterSpacing: '1px' }}>
              {product.brand}
            </div>
            
            <h2 className="fw-bold mb-3">{product.name}</h2>

            <h3 className="text-danger fw-bold mb-4">
              ฿ {Number(product.price).toLocaleString()}
            </h3>

            {/* เลือกสี (พอกดแล้ว URL จะเปลี่ยน ข้อมูลทุกอย่างจะอัปเดตตามสินค้านั้น) */}
            {colorVariants.length > 1 && (
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-end mb-2">
                  <label className="fw-bold">เลือกสี</label>
                  <span className="text-muted small">{colorVariants.length} สี</span>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                  {colorVariants.map(variant => (
                    <Link key={variant.id} to={`/product/${variant.id}`}>
                      <div 
                        className={`border rounded-2 p-1 ${variant.id === product.id ? 'border-dark border-2' : 'border-light'}`}
                        style={{ width: '70px', height: '50px', cursor: 'pointer', backgroundColor: '#f8f9fa' }}
                      >
                        <img src={variant.image} alt={variant.name} className="w-100 h-100" style={{ objectFit: 'contain', mixBlendMode: 'multiply' }} />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* ตารางไซส์ (ดึงจากสต็อกจริง) */}
            <div className="bg-light rounded-4 p-3 mb-4">
              <div className="d-flex align-items-center mb-3">
                <span className="fw-bold me-2">เลือกไซส์ (EU)</span>
              </div>
              
              <div className="row g-2">
                {sizeChart.map(item => {
                  const isSelected = selectedSize?.id === item.id;
                  
                  return (
                    <div className="col-3" key={item.id}>
                      <button 
                        disabled={!item.available}
                        onClick={() => setSelectedSize(item)}
                        className={`w-100 rounded-2 d-flex flex-column align-items-center justify-content-center ${
                          isSelected ? 'border-dark border-2 bg-white' : 
                          !item.available ? 'bg-secondary bg-opacity-10 border-0 text-black-50' : 'bg-white border text-dark shadow-sm'
                        }`}
                        style={{ height: '45px', transition: 'all 0.2s', padding: '5px' }}
                      >
                        <div className="fw-bold" style={{ fontSize: '13px' }}>
                          EU {item.EU}
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ปุ่มเพิ่มลงตะกร้า */}
            {currentUser === 'customer' ? (
              <button 
                className="btn btn-dark w-100 rounded-2 py-3 fw-bold fs-5 mb-3"
                onClick={onAddToCart}
              >
                🛒 เพิ่มลงตะกร้า
              </button>
            ) : currentUser === 'admin' ? (
              <div className="alert alert-warning text-center fw-bold py-2 mb-3">
                สิทธิ์ Admin ไม่สามารถสั่งซื้อสินค้าได้
              </div>
            ) : (
              <Link to="/login" className="btn btn-outline-dark w-100 rounded-2 py-3 fw-bold fs-5 mb-3">
                เข้าสู่ระบบเพื่อสั่งซื้อ
              </Link>
            )}

            <div className="bg-light text-center py-2 rounded-2 text-muted small fw-bold mb-4">
              ✅ สินค้าของแท้ 100% | จัดส่งฟรีเมื่อยอดเกิน 3,000 บาท
            </div>

            {/* รายละเอียดสินค้าเชิงลึก */}
            <div className="mt-auto border-top pt-4">
              
              <div 
                className="d-flex justify-content-between align-items-center" 
                style={{ cursor: 'pointer' }}
                onClick={() => setShowDetails(!showDetails)}
              >
                <h6 className="fw-bold mb-0 text-decoration-underline" style={{ fontSize: '18px' }}>
                  รายละเอียด
                </h6>
                <span className="text-muted">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"
                    style={{ transform: showDetails ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>
                    <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                  </svg>
                </span>
              </div>
              
              <hr className="text-black-50 mt-3 mb-4" />

              {showDetails && (
                <div className="row g-3">
                  <div className="col-4">
                    <div className="text-muted text-uppercase" style={{ fontSize: '11px' }}>แบรนด์</div>
                    <div className="fw-bold text-dark small">{productDetails.brand}</div>
                  </div>
                  <div className="col-4">
                    <div className="text-muted text-uppercase" style={{ fontSize: '11px' }}>โมเดล</div>
                    <div className="fw-bold text-dark small text-truncate" title={productDetails.model}>
                      {productDetails.model}
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="text-muted text-uppercase" style={{ fontSize: '11px' }}>SKU</div>
                    <div className="fw-bold text-dark small">{productDetails.sku}</div>
                  </div>
                  <div className="col-6">
                    <div className="text-muted text-uppercase" style={{ fontSize: '11px' }}>สี</div>
                    <div className="fw-bold text-dark small">{productDetails.color}</div>
                  </div>
                  <div className="col-6">
                    <div className="text-muted text-uppercase" style={{ fontSize: '11px' }}>วันที่วางจำหน่าย</div>
                    <div className="fw-bold text-dark small">{productDetails.releaseDate}</div>
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}