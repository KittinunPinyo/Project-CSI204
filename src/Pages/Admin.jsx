import React, { useState, useEffect } from 'react';
import ManageReviews from './ManageReviews';
import ManagePromotions from './ManagePromotions';

const API_URL = 'http://localhost:5000/api';

/* ========================================================
   1. ตั้งค่าพื้นฐาน: ไซส์, สไตล์ และ ฟังก์ชันสร้าง SKU
======================================================== */
const euSizes = ['35.5', '36', '36.5', '37.5', '38', '38.5', '39.5', '40', '40.5', '41.5', '42', '42.5', '43', '44', '44.5', '45', '45.5', '46.5', '47.5'];
const initialStock = euSizes.reduce((acc, size) => ({ ...acc, [size]: 0 }), {});

// 🌟 ฟังก์ชันสร้าง SKU อัตโนมัติจากแบรนด์
const generateSKU = (brand) => {
  let prefix = 'KZ';
  if (brand === 'adidas') prefix = 'AD';
  else if (brand === 'New Balance') prefix = 'NB';
  else if (brand === 'Puma') prefix = 'PM';
  else if (brand === 'Nike') prefix = 'NK';
  
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${randomNum}`;
};

const getStatusSelectStyle = (status) => {
  const baseStyle = {
    borderRadius: '8px', padding: '10px 16px', fontWeight: 'bold', fontSize: '13px', 
    cursor: 'pointer', outline: 'none', transition: 'all 0.2s'
  };
  switch (status) {
    case 'ได้รับออเดอร์': return { ...baseStyle, backgroundColor: '#F0EBE6', color: '#8C7A6B', border: '1px solid #8C7A6B' };
    case 'กำลังจัดเตรียม': return { ...baseStyle, backgroundColor: '#ffffff', color: '#8C7A6B', border: '2px solid #8C7A6B' };
    case 'ส่งพัสดุแล้ว': return { ...baseStyle, backgroundColor: '#8C7A6B', color: '#ffffff', border: 'none' };
    case 'สำเร็จเรียบร้อย': return { ...baseStyle, backgroundColor: '#5C4E43', color: '#ffffff', border: 'none' };
    default: return { ...baseStyle, backgroundColor: '#F0EBE6', color: '#8C7A6B', border: '1px solid #8C7A6B' };
  }
};

const getThaiStatus = (paymentStatus, orderStatus) => {
  const pay = (paymentStatus || '').trim().toUpperCase();
  const order = (orderStatus || '').trim().toUpperCase();
  if (pay === 'PENDING UPLOAD' || pay === 'รอชำระเงิน' || pay === 'PENDING VERIFICATION' || pay === 'รอตรวจสอบสลิป' || pay === 'ได้รับออเดอร์') return 'ได้รับออเดอร์';
  if (pay === 'PAID' || pay === 'ชำระเงินสำเร็จ') {
    if (order === 'SHIPPED' || order === 'จัดส่งแล้ว') return 'ส่งพัสดุแล้ว';
    if (order === 'DELIVERED' || order === 'สำเร็จ' || order === 'สำเร็จเรียบร้อย') return 'สำเร็จเรียบร้อย';
    return 'กำลังจัดเตรียม';
  }
  return 'ได้รับออเดอร์';
};

/* ========================================================
   2. Component หลัก
======================================================== */
export default function Admin() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('products');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const [productModal, setProductModal] = useState({
    isOpen: false, mode: 'add', id: null, name: '', brand: 'adidas', price: '', sku: '', color: '', stock: initialStock, image: ''
  });

  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, targetId: null, targetName: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const ordersResponse = await fetch(`${API_URL}/orders`);
      if (ordersResponse.ok) setOrders(await ordersResponse.json());
      const productsResponse = await fetch(`${API_URL}/products`);
      if (productsResponse.ok) setProducts(await productsResponse.json());
      setError(null);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const getSafeTotal = (order) => {
    const val = order.totalAmount ?? order.total_amount ?? order.total ?? 0;
    return isNaN(parseFloat(val)) ? 0 : parseFloat(val);
  };
  const getSafeEmail = (order) => order.customerEmail || order.customer_email || order.email || '';

  const handleStatusUpdate = async (orderId, selectValue) => {
    setUpdatingId(orderId);
    setError(null);
    let paymentStatus = 'Pending Verification', orderStatus = 'Processing';

    if (selectValue === 'กำลังจัดเตรียม') { paymentStatus = 'Paid'; orderStatus = 'Processing'; } 
    else if (selectValue === 'ส่งพัสดุแล้ว') { paymentStatus = 'Paid'; orderStatus = 'Shipped'; } 
    else if (selectValue === 'สำเร็จเรียบร้อย') { paymentStatus = 'Paid'; orderStatus = 'Delivered'; }

    try {
      const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus, orderStatus, trackingNumber: orderStatus === 'Shipped' ? 'TH-' + Math.floor(100000 + Math.random() * 900000) : 'N/A' })
      });
      if (!response.ok) throw new Error('การส่งข้อมูลเพื่อเซฟสถานะพัสดุล้มเหลว');
      setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? { ...o, paymentStatus, orderStatus } : o));
      setSuccess('บันทึกสถานะเรียบร้อยแล้ว');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) { setError(err.message); } finally { setUpdatingId(null); }
  };

  const handleStockChange = (size, value) => {
    setProductModal(prev => ({ ...prev, stock: { ...prev.stock, [size]: value } }));
  };

  const openAddProductModal = () => {
    setProductModal({
      isOpen: true, mode: 'add', id: null, name: '', brand: 'adidas', price: '', 
      sku: generateSKU('adidas'), color: '', stock: { ...initialStock }, image: ''
    });
  };

  const openEditProductModal = (product) => {
    let parsedStock = { ...initialStock };
    try {
      if (product.stock) {
        const parsed = typeof product.stock === 'string' ? JSON.parse(product.stock) : product.stock;
        if (typeof parsed === 'object') parsedStock = { ...initialStock, ...parsed };
      }
    } catch (e) { console.warn("สต็อกเดิมผิดพลาด รีเซ็ตเป็น 0"); }

    setProductModal({
      isOpen: true, mode: 'edit', id: product.id, name: product.name || '', brand: product.brand || 'adidas', 
      price: product.price || '', sku: product.sku || '', color: product.color || '', stock: parsedStock, image: product.image || ''
    });
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setError(null);
    const token = localStorage.getItem('token');
    const finalStock = {};
    euSizes.forEach(size => { finalStock[size] = parseInt(productModal.stock[size], 10) || 0; });

    const payload = {
      name: productModal.name, brand: productModal.brand, price: Number(productModal.price) || 0,
      image: productModal.image, sku: productModal.sku, color: productModal.color,
      releaseDate: new Date().toISOString().split('T')[0], stock: finalStock
    };

    const url = productModal.mode === 'add' ? `${API_URL}/products` : `${API_URL}/products/${productModal.id}`;
    const method = productModal.mode === 'add' ? 'POST' : 'PUT';

    try {
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error((await response.json()).error || 'จัดการข้อมูลสินค้าไม่สำเร็จ');
      setSuccess(productModal.mode === 'add' ? 'เพิ่มสินค้าใหม่เรียบร้อยแล้ว' : 'แก้ไขข้อมูลสินค้าสำเร็จ');
      setProductModal({ ...productModal, isOpen: false });
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) { setError(err.message); }
  };

  const executeDeleteProduct = async () => {
    try {
      const response = await fetch(`${API_URL}/products/${deleteConfirm.targetId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      if (!response.ok) throw new Error('ไม่สามารถลบสินค้าออกจากคลังได้');
      setSuccess('ลบสินค้าเรียบร้อยแล้ว');
      setDeleteConfirm({ isOpen: false, targetId: null, targetName: '' });
      fetchData(); setTimeout(() => setSuccess(null), 3000);
    } catch (err) { setError(err.message); setDeleteConfirm({ isOpen: false, targetId: null, targetName: '' }); }
  };

  const filteredOrders = orders.filter(o => getSafeEmail(o).toLowerCase().includes(searchTerm.toLowerCase()) || (o.id || '').toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredProducts = products.filter(p => (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (p.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) || (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase()));
  const paidOrders = orders.filter(o => o.paymentStatus === 'Paid' || o.paymentStatus === 'ชำระเงินสำเร็จ');
  const totalSales = paidOrders.reduce((sum, o) => sum + getSafeTotal(o), 0);
  const pendingSlipCount = orders.filter(o => getThaiStatus(o.paymentStatus, o.orderStatus) === 'ได้รับออเดอร์').length;

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#F8F6F3', minHeight: '100vh', color: '#5C4E43' }}>
      <div style={{ padding: '32px 40px', maxWidth: '1240px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <span style={{ fontSize: '24px' }}>⚙️</span>
          <h1 style={{ fontSize: '26px', fontWeight: '900', margin: 0, letterSpacing: '0.5px', color: '#5C4E43' }}>Admin Panel</h1>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
          {['dashboard', 'products', 'orders', 'reviews', 'promotions'].map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setSearchTerm(''); }}
              style={{ padding: '10px 24px', borderRadius: '50px', border: activeTab === tab ? 'none' : '1px solid #E8E1D9', backgroundColor: activeTab === tab ? '#8C7A6B' : '#ffffff', color: activeTab === tab ? '#ffffff' : '#8C7A6B', fontWeight: '700', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize' }}
            >
              {tab}
            </button>
          ))}
        </div>

        {success && <div style={{ padding: '16px', backgroundColor: '#8C7A6B', color: '#ffffff', marginBottom: '24px', fontWeight: 'bold', fontSize: '14px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>✓ {success}</div>}
        {error && <div style={{ padding: '16px', backgroundColor: '#b87373', color: '#ffffff', marginBottom: '24px', fontWeight: 'bold', fontSize: '14px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>⚠️ ข้อผิดพลาด: {error}</div>}

        {activeTab !== 'dashboard' && (
          <div style={{ marginBottom: '24px' }}>
            <input type="text" placeholder={activeTab === 'products' ? "ค้นหาชื่อรุ่นสินค้า แบรนด์ หรือรหัส SKU..." : "ค้นหาตามเลขออเดอร์ หรืออีเมลลูกค้า..."} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', maxWidth: '400px', padding: '12px 20px', border: '1px solid #E8E1D9', borderRadius: '50px', fontSize: '14px', outline: 'none', backgroundColor: '#ffffff', color: '#5C4E43' }} />
          </div>
        )}

        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            {[{ title: 'ยอดขายสุทธิทั้งหมด', value: `฿${totalSales.toLocaleString('th-TH')}` }, { title: 'จำนวนคำสั่งซื้อรวม', value: `${orders.length} ออเดอร์` }, { title: 'ได้รับออเดอร์แล้ว', value: `${pendingSlipCount} รายการ` }, { title: 'รองเท้าในระบบคลัง', value: `${products.length} รายการ` }].map((stat, i) => (
              <div key={i} style={{ backgroundColor: '#ffffff', padding: '24px', border: '1px solid #E8E1D9', borderRadius: '16px' }}>
                <span style={{ fontSize: '12px', color: '#8C7A6B', fontWeight: 'bold' }}>{stat.title}</span>
                <h3 style={{ fontSize: '28px', fontWeight: '950', color: '#5C4E43', margin: '8px 0 0 0' }}>{stat.value}</h3>
              </div>
            ))}
          </div>
        )}

        {/* Products */}
        {activeTab === 'products' && (
          <div>
            <div onClick={() => productModal.isOpen && productModal.mode === 'add' ? setProductModal({ ...productModal, isOpen: false }) : openAddProductModal()} style={{ backgroundColor: '#ffffff', border: '1px solid #E8E1D9', borderRadius: '16px', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: productModal.isOpen && productModal.mode === 'add' ? '16px' : '32px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>📦</span><span style={{ color: '#8C7A6B', fontWeight: 'bold', fontSize: '15px' }}>เพิ่มสินค้าใหม่</span>
              </div>
              <span style={{ color: '#8C7A6B' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {productModal.isOpen && productModal.mode === 'add' ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
                </svg>
              </span>
            </div>

            {/* ฟอร์มเพิ่มสินค้าแบบ Inline (Accordion) */}
            {productModal.isOpen && productModal.mode === 'add' && (
              <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #E8E1D9', padding: '24px', marginBottom: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8C7A6B', marginBottom: '6px' }}>ชื่อรุ่นรองเท้า</label>
                    <input required type="text" value={productModal.name} onChange={e => setProductModal({...productModal, name: e.target.value})} style={{ width: '100%', padding: '12px 16px', border: '1px solid #E8E1D9', borderRadius: '12px', outline: 'none', color: '#5C4E43' }} placeholder="เช่น Samba OG Shoes White Black" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8C7A6B', marginBottom: '6px' }}>แบรนด์สินค้า</label>
                      <select 
                        value={productModal.brand} 
                        onChange={e => {
                          const newBrand = e.target.value;
                          setProductModal(prev => ({ ...prev, brand: newBrand, sku: prev.mode === 'add' ? generateSKU(newBrand) : prev.sku }));
                        }} 
                        style={{ width: '100%', padding: '12px 16px', border: '1px solid #E8E1D9', borderRadius: '12px', outline: 'none', backgroundColor: '#ffffff', color: '#5C4E43' }}
                      >
                        <option value="adidas">adidas</option>
                        <option value="New Balance">New Balance</option>
                        <option value="Puma">Puma</option>
                        <option value="Nike">Nike</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8C7A6B', marginBottom: '6px' }}>ราคา (บาท)</label>
                      <input required type="number" value={productModal.price} onChange={e => setProductModal({...productModal, price: e.target.value})} style={{ width: '100%', padding: '12px 16px', border: '1px solid #E8E1D9', borderRadius: '12px', outline: 'none', color: '#5C4E43' }} placeholder="3500" />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8C7A6B', marginBottom: '6px' }}>รหัส SKU (สร้างอัตโนมัติ)</label>
                      <input 
                        disabled 
                        type="text" 
                        value={productModal.sku} 
                        style={{ width: '100%', padding: '12px 16px', border: '1px solid #E8E1D9', borderRadius: '12px', outline: 'none', backgroundColor: '#F8F6F3', color: '#8C7A6B', cursor: 'not-allowed', fontWeight: 'bold' }} 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8C7A6B', marginBottom: '6px' }}>โทนสีสินค้า</label>
                      <input type="text" value={productModal.color} onChange={e => setProductModal({...productModal, color: e.target.value})} style={{ width: '100%', padding: '12px 16px', border: '1px solid #E8E1D9', borderRadius: '12px', outline: 'none', color: '#5C4E43' }} placeholder="White/Black/Gum" />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8C7A6B', marginBottom: '6px' }}>ภาพลิงก์พรีวิว URL</label>
                    <input type="text" value={productModal.image} onChange={e => setProductModal({...productModal, image: e.target.value})} style={{ width: '100%', padding: '12px 16px', border: '1px solid #E8E1D9', borderRadius: '12px', outline: 'none', color: '#5C4E43' }} placeholder="วางลิงก์รูปภาพที่นี่" />
                  </div>

                  <div style={{ backgroundColor: '#F8F6F3', padding: '16px', borderRadius: '12px', border: '1px solid #E8E1D9' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8C7A6B', marginBottom: '12px' }}>จัดการสต็อกสินค้าแยกตามไซส์ (จำนวนคู่)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '10px' }}>
                      {euSizes.map(size => (
                        <div key={size} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '11px', color: '#5C4E43', textAlign: 'center', fontWeight: 'bold' }}>EU {size}</span>
                          <input type="number" min="0" value={productModal.stock[size] !== undefined ? productModal.stock[size] : ''} onChange={e => handleStockChange(size, e.target.value)} style={{ width: '100%', padding: '8px 4px', border: '1px solid #E8E1D9', borderRadius: '8px', outline: 'none', color: '#5C4E43', textAlign: 'center', fontSize: '13px' }} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                    <button type="button" onClick={() => setProductModal({...productModal, isOpen: false})} style={{ padding: '12px 24px', border: '1px solid #8C7A6B', color: '#8C7A6B', backgroundColor: '#ffffff', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer' }}>ยกเลิก</button>
                    <button type="submit" style={{ padding: '12px 24px', border: 'none', backgroundColor: '#8C7A6B', color: '#ffffff', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer' }}>บันทึกลงระบบ</button>
                  </div>
                </form>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#5C4E43', margin: 0 }}>รายการสินค้า ({filteredProducts.length})</h3>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#8C7A6B', fontWeight: 'bold' }}>กำลังซิงค์และเชื่อมข้อมูลรองเท้า...</div>
            ) : (
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #E8E1D9', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F0EBE6', borderBottom: '1px solid #E8E1D9' }}>
                      <th style={{ padding: '18px 24px', fontSize: '13px', fontWeight: '900', color: '#5C4E43' }}>รหัส</th>
                      <th style={{ padding: '18px 24px', fontSize: '13px', fontWeight: '900', color: '#5C4E43' }}>รูปภาพ</th>
                      <th style={{ padding: '18px 24px', fontSize: '13px', fontWeight: '900', color: '#5C4E43' }}>ชื่อสินค้า</th>
                      <th style={{ padding: '18px 24px', fontSize: '13px', fontWeight: '900', color: '#5C4E43' }}>แบรนด์</th>
                      <th style={{ padding: '18px 24px', fontSize: '13px', fontWeight: '900', color: '#5C4E43' }}>ราคา</th>
                      <th style={{ padding: '18px 24px', fontSize: '13px', fontWeight: '900', color: '#5C4E43' }}>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr><td colSpan="6" style={{ padding: '48px 24px', textAlign: 'center', color: '#8C7A6B' }}>📭 ไม่พบประวัติรองเท้าในคลังระบบ</td></tr>
                    ) : (
                      filteredProducts.map(prod => (
                        <tr key={prod.id} style={{ borderBottom: '1px solid #F8F6F3', verticalAlign: 'middle' }}>
                          <td style={{ padding: '20px 24px', fontSize: '13px', color: '#8C7A6B', fontWeight: 'bold' }}>{prod.sku}</td>
                          <td style={{ padding: '20px 24px' }}>
                            <img src={prod.image} alt={prod.name} style={{ width: '48px', height: '48px', objectFit: 'contain', backgroundColor: '#F8F6F3', border: '1px solid #E8E1D9', borderRadius: '8px' }} />
                          </td>
                          <td style={{ padding: '20px 24px' }}>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#5C4E43' }}>{prod.name}</div>
                            <div style={{ fontSize: '11px', color: '#8C7A6B' }}>สี: {prod.color || 'N/A'}</div>
                          </td>
                          <td style={{ padding: '20px 24px', fontSize: '14px', fontWeight: 'bold', color: '#8C7A6B' }}>{prod.brand}</td>
                          <td style={{ padding: '20px 24px', fontSize: '15px', fontWeight: '900', color: '#d97777' }}>฿{prod.price.toLocaleString()}</td>
                          <td style={{ padding: '20px 24px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <button onClick={() => openEditProductModal(prod)} style={{ padding: '6px 12px', border: '1px solid #8C7A6B', color: '#8C7A6B', backgroundColor: '#ffffff', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>แก้ไข</button>
                              <button onClick={() => triggerDeleteProduct(prod.id, prod.name)} style={{ padding: '6px 12px', border: '1px solid #d97777', backgroundColor: '#ffffff', color: '#d97777', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>ลบ</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#5C4E43', margin: 0 }}>รายการคำสั่งซื้อ ({filteredOrders.length})</h3>
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#8C7A6B', fontSize: '14px', fontWeight: 'bold' }}>กำลังดาวน์โหลดคำสั่งซื้อและซิงค์ข้อมูล...</div>
            ) : (
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #E8E1D9', borderRadius: '16px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F0EBE6', borderBottom: '1px solid #E8E1D9' }}>
                      <th style={{ padding: '18px 24px', fontSize: '13px', fontWeight: '900', color: '#5C4E43' }}>เลขที่ออเดอร์</th>
                      <th style={{ padding: '18px 24px', fontSize: '13px', fontWeight: '900', color: '#5C4E43' }}>อีเมลลูกค้า</th>
                      <th style={{ padding: '18px 24px', fontSize: '13px', fontWeight: '900', color: '#5C4E43' }}>ยอดรวม</th>
                      <th style={{ padding: '18px 24px', fontSize: '13px', fontWeight: '900', color: '#5C4E43' }}>สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(order => {
                      const customerEmail = getSafeEmail(order);
                      const displayTotal = getSafeTotal(order);
                      const currentStatus = getThaiStatus(order.paymentStatus, order.orderStatus);
                      return (
                        <tr key={order.id} style={{ borderBottom: '1px solid #F8F6F3', verticalAlign: 'middle' }}>
                          <td style={{ padding: '20px 24px' }}><span style={{ color: '#8C7A6B', fontWeight: 'bold', fontSize: '14px' }}>{order.id}</span></td>
                          <td style={{ padding: '20px 24px', fontSize: '14px', fontWeight: 'bold', color: '#5C4E43' }}>{customerEmail}</td>
                          <td style={{ padding: '20px 24px', fontSize: '15px', fontWeight: '900', color: '#d97777' }}>฿{displayTotal.toLocaleString('th-TH')}</td>
                          <td style={{ padding: '20px 24px' }}>
                            <select 
                              value={currentStatus} onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                              style={{ appearance: 'none', paddingRight: '36px', backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', ...getStatusSelectStyle(currentStatus) }}
                            >
                              <option value="ได้รับออเดอร์">ได้รับออเดอร์</option>
                              <option value="กำลังจัดเตรียม">กำลังจัดเตรียม</option>
                              <option value="ส่งพัสดุแล้ว">ส่งพัสดุแล้ว</option>
                              <option value="สำเร็จเรียบร้อย">สำเร็จเรียบร้อย</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Reviews & Promotions Tabs */}
        {activeTab === 'reviews' && <ManageReviews />}
        {activeTab === 'promotions' && <ManagePromotions />}

      </div>

      {/* ==========================================
          Modal: สำหรับฟังก์ชันแก้ไขสินค้า (Edit) เท่านั้น
          ========================================== */}
      {productModal.isOpen && productModal.mode === 'edit' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(92, 78, 67, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', width: '100%', maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '24px', border: '1px solid #E8E1D9', padding: '32px', boxShadow: '0 10px 30px rgba(92, 78, 67, 0.15)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '900', margin: '0 0 24px 0', color: '#5C4E43' }}>📝 แก้ไขข้อมูลสินค้าคลัง</h3>

            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8C7A6B', marginBottom: '6px' }}>ชื่อรุ่นรองเท้า</label>
                <input required type="text" value={productModal.name} onChange={e => setProductModal({...productModal, name: e.target.value})} style={{ width: '100%', padding: '12px 16px', border: '1px solid #E8E1D9', borderRadius: '12px', outline: 'none', color: '#5C4E43' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8C7A6B', marginBottom: '6px' }}>แบรนด์สินค้า</label>
                  <select 
                    value={productModal.brand} 
                    onChange={e => {
                      const newBrand = e.target.value;
                      setProductModal(prev => ({ ...prev, brand: newBrand, sku: prev.mode === 'add' ? generateSKU(newBrand) : prev.sku }));
                    }} 
                    style={{ width: '100%', padding: '12px 16px', border: '1px solid #E8E1D9', borderRadius: '12px', outline: 'none', backgroundColor: '#ffffff', color: '#5C4E43' }}
                  >
                    <option value="adidas">adidas</option>
                    <option value="New Balance">New Balance</option>
                    <option value="Puma">Puma</option>
                    <option value="Nike">Nike</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8C7A6B', marginBottom: '6px' }}>ราคา (บาท)</label>
                  <input required type="number" value={productModal.price} onChange={e => setProductModal({...productModal, price: e.target.value})} style={{ width: '100%', padding: '12px 16px', border: '1px solid #E8E1D9', borderRadius: '12px', outline: 'none', color: '#5C4E43' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8C7A6B', marginBottom: '6px' }}>รหัส SKU</label>
                  <input 
                    disabled 
                    type="text" 
                    value={productModal.sku} 
                    style={{ width: '100%', padding: '12px 16px', border: '1px solid #E8E1D9', borderRadius: '12px', outline: 'none', backgroundColor: '#F8F6F3', color: '#8C7A6B', cursor: 'not-allowed', fontWeight: 'bold' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8C7A6B', marginBottom: '6px' }}>โทนสีสินค้า</label>
                  <input type="text" value={productModal.color} onChange={e => setProductModal({...productModal, color: e.target.value})} style={{ width: '100%', padding: '12px 16px', border: '1px solid #E8E1D9', borderRadius: '12px', outline: 'none', color: '#5C4E43' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8C7A6B', marginBottom: '6px' }}>ภาพลิงก์พรีวิว URL</label>
                <input type="text" value={productModal.image} onChange={e => setProductModal({...productModal, image: e.target.value})} style={{ width: '100%', padding: '12px 16px', border: '1px solid #E8E1D9', borderRadius: '12px', outline: 'none', color: '#5C4E43' }} />
              </div>

              {/* 🌟 ส่วนจัดการสต็อกแบบ Grid ใน Modal แก้ไข */}
              <div style={{ backgroundColor: '#F8F6F3', padding: '16px', borderRadius: '12px', border: '1px solid #E8E1D9' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8C7A6B', marginBottom: '12px' }}>จัดการสต็อกสินค้าแยกตามไซส์ (จำนวนคู่)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(65px, 1fr))', gap: '8px' }}>
                  {euSizes.map(size => (
                    <div key={size} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '11px', color: '#5C4E43', textAlign: 'center', fontWeight: 'bold' }}>EU {size}</span>
                      <input type="number" min="0" value={productModal.stock[size] !== undefined ? productModal.stock[size] : ''} onChange={e => handleStockChange(size, e.target.value)} style={{ width: '100%', padding: '6px 4px', border: '1px solid #E8E1D9', borderRadius: '8px', outline: 'none', color: '#5C4E43', textAlign: 'center', fontSize: '12px' }} />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setProductModal({...productModal, isOpen: false})} style={{ flex: 1, padding: '14px', border: '1px solid #8C7A6B', color: '#8C7A6B', backgroundColor: '#ffffff', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer' }}>ยกเลิก</button>
                <button type="submit" style={{ flex: 1, padding: '14px', border: 'none', backgroundColor: '#8C7A6B', color: '#ffffff', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer' }}>บันทึกการเปลี่ยนแปลง</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(92, 78, 67, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', width: '100%', maxWidth: '400px', borderRadius: '24px', border: '1px solid #E8E1D9', padding: '32px', textAlign: 'center', boxShadow: '0 10px 30px rgba(92, 78, 67, 0.15)' }}>
            <span style={{ fontSize: '32px', display: 'block', marginBottom: '16px' }}>⚠️</span>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 12px 0', color: '#5C4E43' }}>ยืนยันลบข้อมูลสินค้า</h3>
            <p style={{ fontSize: '14px', color: '#8C7A6B', lineHeight: '1.5', margin: '0 0 24px 0' }}>แน่ใจใช่หรือไม่ที่จะลบ <strong style={{ color: '#5C4E43' }}>{deleteConfirm.targetName}</strong> ออกจากระบบ?</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setDeleteConfirm({ isOpen: false, targetId: null, targetName: '' })} style={{ flex: 1, padding: '14px', border: '1px solid #8C7A6B', color: '#8C7A6B', backgroundColor: '#ffffff', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer' }}>ยกเลิก</button>
              <button onClick={executeDeleteProduct} style={{ flex: 1, padding: '14px', border: 'none', backgroundColor: '#d97777', color: '#ffffff', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer' }}>ยืนยันลบถาวร</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}