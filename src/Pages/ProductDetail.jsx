import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ProductReviews from '../components/ProductReviews';

export default function ProductDetail({ products, currentUser, handleAddToCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [selectedSize, setSelectedSize] = useState(null);
  const [showDetails, setShowDetails] = useState(true);

  useEffect(() => {
    setSelectedSize(null);
  }, [id]);

  const product = products.find(p => p.id === id || p.id === Number(id));

  if (!product) {
    return <div className="text-center py-5 mt-5 fw-bold" style={{ color: '#8C7A6B' }}>กำลังโหลดข้อมูล... หรือไม่พบสินค้านี้</div>;
  }

  const colorVariants = products.filter(p => p.name === product.name);
  
  const productDetails = {
    brand: product.brand || '-',
    model: product.name,
    sku: product.sku || '-',
    color: product.color || '-',
    releaseDate: product.releaseDate || '-'
  };

  const euSizes = ['35.5', '36', '36.5', '37.5', '38', '38.5', '39.5', '40', '40.5', '41.5', '42', '42.5', '43', '44', '44.5', '45', '45.5', '46.5', '47.5'];
  const sizeChart = euSizes.map((size, index) => {
    const stockCount = product.stock ? Number(product.stock[size] || 0) : 0;
    return { id: index + 1, EU: size, available: stockCount > 0 };
  });

  const onAddToCart = () => {
    if (!selectedSize) {
      alert("กรุณาเลือกไซส์ก่อนเพิ่มลงตะกร้าครับ");
      return;
    }
    handleAddToCart({ ...product, selectedSize: `EU ${selectedSize.EU}`, price: product.price });
  };

  return (
    <div style={{ backgroundColor: '#F8F6F3', minHeight: '100vh', paddingBottom: '50px' }}>
      <div className="container py-5">
        
        <button onClick={() => navigate(-1)} className="btn btn-link text-decoration-none fw-bold px-0 mb-4" style={{ color: '#8C7A6B' }}>
          &larr; ย้อนกลับ
        </button>

        <div className="row g-5">
          {/* ฝั่งซ้าย: รูปภาพสินค้า */}
          <div className="col-lg-7">
            <div className="position-sticky" style={{ top: '20px' }}>
              <div className="bg-white rounded-4 d-flex align-items-center justify-content-center p-4 shadow-sm" style={{ backgroundColor: '#F0EBE6' }}>
                {product.image ? (
                  <img src={product.image} alt={product.name} className="img-fluid" style={{ maxHeight: '400px', width: '100%', objectFit: 'contain' }} />
                ) : (
                  <span className="py-5" style={{ color: '#8C7A6B' }}>ไม่มีรูปภาพ</span>
                )}
              </div>
            </div>
          </div>

          {/* ฝั่งขวา: ข้อมูล ไซส์ และรายละเอียด */}
          <div className="col-lg-5">
            <div className="d-flex flex-column h-100">
              
              <div className="text-uppercase fw-bold mb-1" style={{ fontSize: '12px', letterSpacing: '1px', color: '#8C7A6B' }}>
                {product.brand}
              </div>
              
              <h2 className="fw-bold mb-3" style={{ color: '#5C4E43' }}>{product.name}</h2>

              <h3 className="fw-bold mb-4" style={{ color: '#5C4E43' }}>
                ฿ {Number(product.price).toLocaleString('th-TH')}
              </h3>

              {/* เลือกสี */}
              {colorVariants.length > 1 && (
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-end mb-2">
                    <label className="fw-bold" style={{ color: '#5C4E43' }}>เลือกสี</label>
                    <span className="small" style={{ color: '#8C7A6B' }}>{colorVariants.length} สี</span>
                  </div>
                  <div className="d-flex gap-2 flex-wrap">
                    {colorVariants.map(variant => (
                      <Link key={variant.id} to={`/product/${variant.id}`}>
                        <div 
                          className={`border rounded-2 p-1 ${variant.id === product.id ? 'border-2' : ''}`} 
                          style={{ width: '70px', height: '50px', borderColor: variant.id === product.id ? '#8C7A6B' : '#E8E1D9', backgroundColor: '#fff' }}
                        >
                          <img src={variant.image} alt={variant.name} className="w-100 h-100" style={{ objectFit: 'contain' }} />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* ตารางไซส์ */}
              <div className="bg-white rounded-4 p-4 mb-4 shadow-sm border" style={{ borderColor: '#E8E1D9' }}>
                <label className="fw-bold mb-3" style={{ color: '#5C4E43' }}>เลือกไซส์ (EU)</label>
                <div className="row g-2">
                  {sizeChart.map(item => (
                    <div className="col-3" key={item.id}>
                      <button 
                        disabled={!item.available}
                        onClick={() => setSelectedSize(item)}
                        className={`w-100 rounded-pill border-0 d-flex align-items-center justify-content-center ${selectedSize?.id === item.id ? 'text-white' : !item.available ? 'bg-light text-black-50' : 'bg-white border shadow-sm'}`}
                        style={{ height: '40px', backgroundColor: selectedSize?.id === item.id ? '#8C7A6B' : '' }}
                      >
                        <span className="fw-bold" style={{ fontSize: '13px' }}>EU {item.EU}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 🌟 ปุ่มสั่งซื้อ / แจ้งเตือนสิทธิ์ Admin */}
              {currentUser === 'customer' ? (
                <button 
                  className="btn w-100 rounded-pill py-3 fw-bold fs-5 mb-3 text-white shadow-sm" 
                  style={{ backgroundColor: '#8C7A6B', transition: 'all 0.2s' }} 
                  onClick={onAddToCart}
                >
                  🛒 เพิ่มลงตะกร้า
                </button>
              ) : currentUser === 'admin' ? (
                <div 
                  className="w-100 rounded-pill py-3 fw-bold fs-5 mb-3 text-center shadow-sm" 
                  style={{ backgroundColor: '#E8E1D9', color: '#8C7A6B', border: '1px solid #C2B5A8' }}
                >
                  ⚠️ สิทธิ์ Admin ไม่สามารถสั่งซื้อสินค้าได้
                </div>
              ) : (
                <Link 
                  to="/login" 
                  className="btn w-100 rounded-pill py-3 fw-bold fs-5 mb-3 text-white shadow-sm d-flex justify-content-center align-items-center text-decoration-none" 
                  style={{ backgroundColor: '#8C7A6B' }}
                >
                  เข้าสู่ระบบเพื่อสั่งซื้อ
                </Link>
              )}

              <div className="text-center py-2 rounded-pill small fw-bold mb-4" style={{ backgroundColor: '#E8E1D9', color: '#5C4E43' }}>
                ✅ สินค้าของแท้ 100% | จัดส่งฟรีเมื่อยอดเกิน 3,000 บาท
              </div>

              {/* รายละเอียดสินค้า */}
              <div className="mt-auto border-top pt-4" style={{ borderColor: '#E8E1D9' }}>
                <div className="d-flex justify-content-between align-items-center" style={{ cursor: 'pointer', color: '#5C4E43' }} onClick={() => setShowDetails(!showDetails)}>
                  <h6 className="fw-bold mb-0 text-decoration-underline" style={{ fontSize: '18px' }}>รายละเอียด</h6>
                  <span style={{ transform: showDetails ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>
                    ▼
                  </span>
                </div>
                
                {showDetails && (
                  <div className="row g-3 mt-3" style={{ color: '#8C7A6B' }}>
                    <div className="col-4">
                      <div className="text-uppercase" style={{ fontSize: '10px' }}>แบรนด์</div>
                      <div className="fw-bold" style={{ color: '#5C4E43', fontSize: '13px' }}>{productDetails.brand}</div>
                    </div>
                    <div className="col-4">
                      <div className="text-uppercase" style={{ fontSize: '10px' }}>โมเดล</div>
                      <div className="fw-bold text-truncate" style={{ color: '#5C4E43', fontSize: '13px' }} title={productDetails.model}>{productDetails.model}</div>
                    </div>
                    <div className="col-4">
                      <div className="text-uppercase" style={{ fontSize: '10px' }}>SKU</div>
                      <div className="fw-bold" style={{ color: '#5C4E43', fontSize: '13px' }}>{productDetails.sku}</div>
                    </div>
                    <div className="col-6">
                      <div className="text-uppercase" style={{ fontSize: '10px' }}>สี</div>
                      <div className="fw-bold" style={{ color: '#5C4E43', fontSize: '13px' }}>{productDetails.color}</div>
                    </div>
                    <div className="col-6">
                      <div className="text-uppercase" style={{ fontSize: '10px' }}>วันที่วางจำหน่าย</div>
                      <div className="fw-bold" style={{ color: '#5C4E43', fontSize: '13px' }}>{productDetails.releaseDate}</div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* ส่วนรีวิวสินค้า */}
        <div className="mt-5 pt-4 border-top" style={{ borderColor: '#E8E1D9' }}>
          <ProductReviews productId={id} />
        </div>

      </div>
    </div>
  );
}