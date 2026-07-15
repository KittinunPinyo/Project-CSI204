import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';

export default function Admin({ 
  currentUser, 
  products, 
  newProduct, 
  setNewProduct, 
  handleAddProduct, 
  handleDeleteProduct, 
  handleEditProduct, 
  orders, 
  handleUpdateOrderStatus 
}) {
  const [activeTab, setActiveTab] = useState('products');
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [adminSearch, setAdminSearch] = useState('');
  
  // 🔴 State ใหม่สำหรับควบคุมการเปิด/ปิดฟอร์มเพิ่มสินค้า
  const [showForm, setShowForm] = useState(false);

  if (currentUser !== 'admin') return <Navigate to="/" />;

  const totalSales = orders.reduce((sum, order) => sum + Number(order.total), 0);

  // รายการไซส์ EU สำหรับจัดการสต็อก
  const euSizes = ['35.5', '36', '36.5', '37.5', '38', '38.5', '39.5', '40', '40.5', '41.5', '42', '42.5', '43', '44', '44.5', '45', '45.5', '46.5', '47.5'];

  // สร้าง State เริ่มต้นให้มีฟิลด์ใหม่ๆ รองรับ (SKU, Color, Date, Stock)
  const resetForm = () => {
    setIsEditing(false);
    setEditId(null);
    setShowForm(false); // พับฟอร์มเก็บเมื่อกดบันทึกหรือยกเลิก
    const initialStock = {};
    euSizes.forEach(size => initialStock[size] = 0);
    setNewProduct({ 
      name: "", brand: "", price: "", image: "", 
      sku: "", color: "", releaseDate: "", stock: initialStock 
    });
  };

  const startEdit = (product) => {
    setIsEditing(true);
    setEditId(product.id);
    setShowForm(true); // เปิดฟอร์มอัตโนมัติเมื่อกดแก้ไข
    
    // โหลดสต็อกเดิม (ถ้ามี) หรือเซ็ตเป็น 0
    const loadedStock = {};
    euSizes.forEach(size => {
      loadedStock[size] = product.stock && product.stock[size] ? product.stock[size] : 0;
    });

    setNewProduct({ 
      name: product.name, 
      brand: product.brand || '', 
      price: product.price.toString(), 
      image: product.image || '',
      sku: product.sku || '',
      color: product.color || '',
      releaseDate: product.releaseDate || '',
      stock: loadedStock
    });
  };

  const handleStockChange = (size, value) => {
    setNewProduct({
      ...newProduct,
      stock: { ...newProduct.stock, [size]: Number(value) }
    });
  };

  const filteredProducts = products.filter(p => {
    const query = adminSearch.toLowerCase();
    const strId = p.id ? p.id.toString().toLowerCase() : '';
    const strName = p.name ? p.name.toLowerCase() : '';
    const strBrand = p.brand ? p.brand.toLowerCase() : '';
    return strId.includes(query) || strName.includes(query) || strBrand.includes(query);
  });

  return (
    <div className="container py-5">
      <h3 className="fw-bold mb-4">⚙️ Admin Panel</h3>
      
      <div className="nav nav-pills mb-4 gap-2">
        {['dashboard', 'products', 'orders'].map(tab => (
          <button 
            key={tab} 
            className={`nav-link text-capitalize fw-bold ${activeTab === tab ? 'active bg-dark' : 'bg-light text-dark'}`} 
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div className="row g-4">
          <div className="col-md-4">
            <div className="card p-4 bg-primary text-white text-center shadow-sm border-0 rounded-4">
              <h5>ยอดขายรวม</h5>
              <h2 className="fw-bold">฿{totalSales.toLocaleString()}</h2>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card p-4 bg-success text-white text-center shadow-sm border-0 rounded-4">
              <h5>จำนวนออเดอร์</h5>
              <h2 className="fw-bold">{orders.length}</h2>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card p-4 bg-warning text-dark text-center shadow-sm border-0 rounded-4">
              <h5>จำนวนสินค้า</h5>
              <h2 className="fw-bold">{products.length}</h2>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div>
          {/* ======================================= */}
          {/* ฟอร์มจัดการสินค้าแบบพับได้ (Accordion) */}
          {/* ======================================= */}
          <div className="card p-4 border-0 shadow-sm rounded-4 mb-5 bg-light transition-all">
            
            {/* Header กดเพื่อเปิด/ปิด */}
            <div 
              className="d-flex justify-content-between align-items-center" 
              style={{ cursor: 'pointer' }}
              onClick={() => {
                setShowForm(!showForm);
                if (showForm && isEditing) resetForm(); // ถ้ายกเลิกการเปิดตอนแก้ไข ให้รีเซ็ตค่าด้วย
              }}
            >
              <h5 className="fw-bold mb-0 text-primary">
                {isEditing ? '✏️ แก้ไขข้อมูลสินค้า' : '📦 เพิ่มสินค้าใหม่'}
              </h5>
              <span className="text-muted">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="20" 
                  height="20" 
                  fill="currentColor" 
                  viewBox="0 0 16 16"
                  style={{ 
                    transform: showForm ? 'rotate(180deg)' : 'rotate(0deg)', 
                    transition: 'transform 0.3s ease' 
                  }}
                >
                  <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                </svg>
              </span>
            </div>
            
            {/* เนื้อหาฟอร์มที่จะแสดงเมื่อ showForm = true */}
            {showForm && (
              <form className="mt-4 border-top pt-4" onSubmit={(e) => { 
                e.preventDefault(); 
                isEditing ? handleEditProduct({...newProduct, id: editId}) : handleAddProduct(e); 
                resetForm();
              }}>
                
                {/* ข้อมูลพื้นฐาน */}
                <h6 className="fw-bold text-muted mb-3">1. ข้อมูลพื้นฐาน</h6>
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">ชื่อสินค้า</label>
                    <input className="form-control" value={newProduct.name || ''} onChange={e => setNewProduct({...newProduct, name: e.target.value})} required/>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-bold">แบรนด์</label>
                    <input className="form-control" value={newProduct.brand || ''} onChange={e => setNewProduct({...newProduct, brand: e.target.value})} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-bold">ราคา (฿)</label>
                    <input type="number" className="form-control" value={newProduct.price || ''} onChange={e => setNewProduct({...newProduct, price: e.target.value})} required/>
                  </div>
                  <div className="col-md-12">
                    <label className="form-label small fw-bold">URL รูปภาพ</label>
                    <input className="form-control" value={newProduct.image || ''} onChange={e => setNewProduct({...newProduct, image: e.target.value})} />
                  </div>
                </div>

                {/* รายละเอียดเชิงลึก */}
                <h6 className="fw-bold text-muted mb-3">2. รายละเอียดเชิงลึก</h6>
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <label className="form-label small fw-bold">SKU (รหัสอ้างอิง)</label>
                    <input className="form-control" placeholder="เช่น KZ-0001" value={newProduct.sku || ''} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-bold">สี (Colorway)</label>
                    <input className="form-control" placeholder="เช่น Cloud White" value={newProduct.color || ''} onChange={e => setNewProduct({...newProduct, color: e.target.value})} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-bold">วันที่วางจำหน่าย</label>
                    <input type="date" className="form-control" value={newProduct.releaseDate || ''} onChange={e => setNewProduct({...newProduct, releaseDate: e.target.value})} />
                  </div>
                </div>

                {/* จัดการสต็อก */}
                <h6 className="fw-bold text-muted mb-3">3. จัดการสต็อก (ระบุจำนวนชิ้น)</h6>
                <div className="row g-3 mb-4">
                  {euSizes.map(size => (
                    <div className="col-6 col-sm-4 col-md-3 col-lg-2" key={size}>
                      <div className="input-group input-group-sm shadow-sm rounded">
                        <span className="input-group-text fw-bold bg-white" style={{ width: '65px', justifyContent: 'center', fontSize: '12px' }}>
                          EU {size}
                        </span>
                        <input 
                          type="number" 
                          className="form-control text-center fw-bold text-primary" 
                          min="0"
                          value={newProduct.stock ? newProduct.stock[size] : 0} 
                          onChange={(e) => handleStockChange(size, e.target.value)}
                          style={{ fontSize: '14px' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="d-flex gap-2">
                  <button type="submit" className={`btn fw-bold px-4 ${isEditing ? 'btn-primary' : 'btn-dark'}`}>
                    {isEditing ? 'บันทึกการอัปเดต' : '+ เพิ่มสินค้าลงระบบ'}
                  </button>
                  {isEditing && (
                    <button type="button" className="btn btn-outline-secondary fw-bold" onClick={resetForm}>
                      ยกเลิก
                    </button>
                  )}
                </div>

              </form>
            )}
          </div>

          {/* ======================================= */}
          {/* ตารางแสดงสินค้า */}
          {/* ======================================= */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold mb-0">รายการสินค้า ({filteredProducts.length})</h5>
            <input 
              type="text" 
              className="form-control form-control-sm w-25 bg-light border-0 py-2 px-3 rounded-3" 
              placeholder="🔍 ค้นหารหัส, ชื่อ, แบรนด์..." 
              value={adminSearch} 
              onChange={(e) => setAdminSearch(e.target.value)} 
            />
          </div>

          <div className="table-responsive bg-white rounded-4 shadow-sm p-3">
            <table className="table align-middle table-hover mb-0">
              <thead className="table-light text-muted small">
                <tr>
                  <th>รหัส</th>
                  <th>รูปภาพ</th>
                  <th>ชื่อสินค้า</th>
                  <th>แบรนด์</th>
                  <th>ราคา</th>
                  <th className="text-end">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(p => (
                    <tr key={p.id}>
                      <td className="text-muted small">#{p.id}</td>
                      <td>
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="rounded" style={{ width: '50px', height: '50px', objectFit: 'cover' }} />
                        ) : (
                          <div className="bg-light rounded d-flex align-items-center justify-content-center text-muted" style={{ width: '50px', height: '50px', fontSize: '12px' }}>No Pic</div>
                        )}
                      </td>
                      <td className="fw-bold">{p.name}</td>
                      <td>{p.brand || '-'}</td>
                      <td className="text-danger fw-bold">฿{Number(p.price).toLocaleString()}</td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => startEdit(p)}>แก้ไข</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteProduct(p.id)}>ลบ</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted">ไม่พบสินค้าที่ค้นหา</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="card p-4 border-0 shadow-sm rounded-4">
          <table className="table align-middle">
            <thead className="table-light">
              <tr>
                <th>เลขที่ออเดอร์</th>
                <th>อีเมลลูกค้า</th>
                <th>ยอดรวม</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td className="text-primary fw-bold">{o.id}</td>
                  <td>{o.customer_email}</td>
                  <td className="fw-bold">฿{Number(o.total).toLocaleString()}</td>
                  <td>
                    <select 
                      className={`form-select-sm fw-bold border-0 p-2 rounded-2 ${
                        o.status === 'จัดส่งแล้ว' ? 'bg-success text-white' : 
                        o.status === 'กำลังจัดเตรียมสินค้า' ? 'bg-info text-dark' : 'bg-warning text-dark'
                      }`} 
                      value={o.status} 
                      onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                    >
                      <option value="รอชำระเงิน">รอชำระเงิน</option>
                      <option value="กำลังจัดเตรียมสินค้า">กำลังจัดเตรียมสินค้า</option>
                      <option value="จัดส่งแล้ว">จัดส่งแล้ว</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}