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
    return <div className="text-center py-5 mt-5 fw-bold" style={{ color: '#8C7A6B' }}>กำลังโหลดข้อมูล...</div>;
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
          <div className="col-lg-7">
            <div className="bg-white rounded-4 d-flex align-items-center justify-content-center p-4 shadow-sm" style={{ backgroundColor: '#F0EBE6' }}>
              {product.image ? (
                <img src={product.image} alt={product.name} className="img-fluid" style={{ maxHeight: '400px', width: '100%', objectFit: 'contain' }} />
              ) : <span className="py-5" style={{ color: '#8C7A6B' }}>ไม่มีรูปภาพ</span>}
            </div>
          </div>

          <div className="col-lg-5">
            <div className="d-flex flex-column h-100">
              <div className="text-uppercase fw-bold mb-1" style={{ fontSize: '12px', letterSpacing: '1px', color: '#8C7A6B' }}>{product.brand}</div>
              <h2 className="fw-bold mb-3" style={{ color: '#5C4E43' }}>{product.name}</h2>
              <h3 className="fw-bold mb-4" style={{ color: '#5C4E43' }}>฿ {Number(product.price).toLocaleString()}</h3>

              {colorVariants.length > 1 && (
                <div className="mb-4">
                  <label className="fw-bold mb-2" style={{ color: '#5C4E43' }}>เลือกสี</label>
                  <div className="d-flex gap-2 flex-wrap">
                    {colorVariants.map(variant => (
                      <Link key={variant.id} to={`/product/${variant.id}`}>
                        <div className={`border rounded-2 p-1 ${variant.id === product.id ? 'border-2' : ''}`} style={{ width: '70px', height: '50px', borderColor: variant.id === product.id ? '#8C7A6B' : '#E8E1D9', backgroundColor: '#fff' }}>
                          <img src={variant.image} alt={variant.name} className="w-100 h-100" style={{ objectFit: 'contain' }} />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-4 p-3 mb-4 shadow-sm border" style={{ borderColor: '#E8E1D9' }}>
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

              {currentUser === 'customer' ? (
                <button className="btn w-100 rounded-pill py-3 fw-bold fs-5 mb-3 text-white shadow-sm" style={{ backgroundColor: '#8C7A6B' }} onClick={onAddToCart}>
                  🛒 เพิ่มลงตะกร้า
                </button>
              ) : (
                <Link to="/login" className="btn w-100 rounded-pill py-3 fw-bold fs-5 mb-3 text-white shadow-sm" style={{ backgroundColor: '#8C7A6B' }}>
                  เข้าสู่ระบบเพื่อสั่งซื้อ
                </Link>
              )}

              <div className="text-center py-2 rounded-pill small fw-bold mb-4" style={{ backgroundColor: '#E8E1D9', color: '#5C4E43' }}>
                ✅ สินค้าของแท้ 100% | จัดส่งฟรีเมื่อยอดเกิน 3,000 บาท
              </div>

              <div className="mt-auto border-top pt-4">
                <div className="d-flex justify-content-between align-items-center" style={{ cursor: 'pointer', color: '#5C4E43' }} onClick={() => setShowDetails(!showDetails)}>
                  <h6 className="fw-bold mb-0 text-decoration-underline">รายละเอียด</h6>
                </div>
                {showDetails && (
                  <div className="row g-3 mt-2" style={{ color: '#8C7A6B' }}>
                    {['แบรนด์', 'โมเดล', 'SKU', 'สี', 'วันที่วางจำหน่าย'].map((label, idx) => (
                      <div className="col-4" key={idx}>
                        <div className="text-uppercase" style={{ fontSize: '10px' }}>{label}</div>
                        <div className="fw-bold" style={{ color: '#5C4E43', fontSize: '13px' }}>{Object.values(productDetails)[idx]}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-4 border-top">
          <ProductReviews productId={id} />
        </div>
      </div>
    </div>
  );
}