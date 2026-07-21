import React, { useState, useEffect } from 'react';
import ManageReviews from './ManageReviews';
import ManagePromotions from './ManagePromotions';
import ProductDiscountManager from '../components/ProductDiscountManager';

const API_URL = 'http://localhost:5000/api';

/* ========================================================
   1. ตั้งค่าพื้นฐาน: ไซส์, สไตล์ และ ฟังก์ชันสร้าง SKU
======================================================== */
const euSizes = ['35.5', '36', '36.5', '37.5', '38', '38.5', '39.5', '40', '40.5', '41.5', '42', '42.5', '43', '44', '44.5', '45', '45.5', '46.5', '47.5'];
const initialStock = euSizes.reduce((acc, size) => ({ ...acc, [size]: 0 }), {});

const generateSKU = (brand) => {
  let prefix = 'KZ';
  if (!brand) {
    prefix = 'KZ';
  } else if (brand.toLowerCase() === 'adidas') prefix = 'AD';
  else if (brand.toLowerCase() === 'new balance') prefix = 'NB';
  else if (brand.toLowerCase() === 'puma') prefix = 'PM';
  else if (brand.toLowerCase() === 'nike') prefix = 'NK';
  else {
    const words = brand.trim().split(/\s+/);
    if (words.length > 1) {
      prefix = (words[0][0] + words[1][0]).toUpperCase();
    } else {
      prefix = brand.substring(0, 2).toUpperCase();
    }
  }
  return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
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

const getRoleSelectStyle = (role) => {
  const baseStyle = {
    borderRadius: '8px', padding: '8px 14px', fontWeight: 'bold', fontSize: '13px', 
    cursor: 'pointer', outline: 'none', transition: 'all 0.2s'
  };
  if (role === 'admin') {
    return { ...baseStyle, backgroundColor: '#5C4E43', color: '#ffffff', border: 'none' };
  }
  return { ...baseStyle, backgroundColor: '#ffffff', color: '#8C7A6B', border: '2px solid #8C7A6B' };
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
  const [discountProduct, setDiscountProduct] = useState(null);
  const [isDiscountManagerOpen, setIsDiscountManagerOpen] = useState(false);
  const [users, setUsers] = useState([]); // 🌟 เพิ่มสเตตัสเก็บข้อมูลผู้ใช้
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const [productModal, setProductModal] = useState({
    isOpen: false, mode: 'add', id: null, name: '', brand: 'adidas', price: '', sku: '', color: '', releaseDate: '', stock: initialStock, image: '', discountType: 'fixed', discountValue: 0, isCustomBrand: false
  });

  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, targetId: null, targetName: '' });
  const [userDeleteConfirm, setUserDeleteConfirm] = useState({ isOpen: false, targetId: null, targetName: '' }); // 🌟 เพิ่มยืนยันลบผู้ใช้

  const defaultBrands = ['adidas'];
  const uniqueBrands = Array.from(new Set([...defaultBrands, ...products.map(p => p.brand).filter(Boolean)]));

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      const ordersResponse = await fetch(`${API_URL}/orders`);
      if (ordersResponse.ok) setOrders(await ordersResponse.json());

      const productsResponse = await fetch(`${API_URL}/products`);
      if (productsResponse.ok) {
        const productsPayload = await productsResponse.json();
        setProducts(productsPayload.map(prod => ({
          ...prod,
          discountType: prod.discount_type || prod.discountType || 'fixed',
          discountValue: Number(prod.discount_value ?? prod.discountValue ?? 0)
        })));
      }

      // 🌟 ดึงข้อมูลรายชื่อผู้ใช้งานในระบบ
      const usersResponse = await fetch(`${API_URL}/users`, { headers });
      if (usersResponse.ok) setUsers(await usersResponse.json());
      
      setError(null);
    } catch (err) { 
      setError(err.message); 
    } finally { 
      setLoading(false); 
    }
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

  // 🌟 ฟังก์ชันอัปเดตสิทธิ์ (Role) ของผู้ใช้งาน
  const handleRoleUpdate = async (userId, newRole) => {
    setError(null);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ role: newRole })
      });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || 'เปลี่ยนสิทธิ์ผู้ใช้ไม่สำเร็จ');
      
      setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setSuccess('อัปเดตสิทธิ์ผู้ใช้งานเรียบร้อยแล้ว');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) { 
      setError(err.message); 
    }
  };

  // 🌟 ฟังก์ชันดำเนินการลบผู้ใช้งานออกจากระบบ
  const executeDeleteUser = async () => {
    setError(null);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/users/${userDeleteConfirm.targetId}`, { 
          method: 'DELETE', 
          headers: { 'Authorization': `Bearer ${token}` } 
      });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || 'ไม่สามารถลบผู้ใช้ออกจากระบบได้');
      
      setSuccess('ลบผู้ใช้งานเรียบร้อยแล้ว');
      setUserDeleteConfirm({ isOpen: false, targetId: null, targetName: '' });
      fetchData(); 
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) { 
      setError(err.message); 
      setUserDeleteConfirm({ isOpen: false, targetId: null, targetName: '' }); 
    }
  };

  const handleStockChange = (size, value) => {
    setProductModal(prev => ({ ...prev, stock: { ...prev.stock, [size]: value } }));
  };

  const openAddProductModal = () => {
    const defaultBrand = uniqueBrands[0] || 'adidas';
    setProductModal({
      isOpen: true, mode: 'add', id: null, name: '', brand: defaultBrand, price: '', 
      sku: generateSKU(defaultBrand), color: '', releaseDate: '', stock: { ...initialStock }, image: '', discountType: 'fixed', discountValue: 0, isCustomBrand: false
    });
  };

  const openEditProductModal = (product) => {
    let parsedStock = { ...initialStock };
    try {
      if (product.stock) {
        const data = typeof product.stock === 'string' ? JSON.parse(product.stock) : product.stock;
        parsedStock = { ...initialStock, ...data };
      }
    } catch (e) { console.warn("สต็อกเดิมผิดพลาด รีเซ็ตเป็น 0"); }

    const fetchedColor = product.color || product.colour || '';
    const fetchedReleaseDate = product.releaseDate || product.release_date || '';

    setProductModal({
      isOpen: true, mode: 'edit', id: product.id, name: product.name || '', brand: product.brand || uniqueBrands[0], price: product.price || '', sku: product.sku || '', color: fetchedColor, releaseDate: fetchedReleaseDate, stock: parsedStock, image: product.image || '', discountType: product.discount_type || product.discountType || 'fixed', discountValue: Number(product.discount_value ?? product.discountValue ?? 0), isCustomBrand: false
    });
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setError(null);
    const token = localStorage.getItem('token');
    
    const finalStock = {};
    euSizes.forEach(size => { 
        finalStock[size] = parseInt(productModal.stock[size] || 0, 10); 
    });

    const payload = {
      name: productModal.name,
      brand: productModal.brand,
      price: Number(productModal.price) || 0,
      image: productModal.image,
      sku: productModal.sku,
      color: productModal.color,
      releaseDate: productModal.releaseDate || '-',
      stock: finalStock,
      discountType: productModal.discountType,
      discountValue: Number(productModal.discountValue) || 0
    };

    const url = productModal.mode === 'add' ? `${API_URL}/products` : `${API_URL}/products/${productModal.id}`;
    const method = productModal.mode === 'add' ? 'POST' : 'PUT';

    try {
      const response = await fetch(url, { 
          method: method, 
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
          body: JSON.stringify(payload) 
      });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || 'จัดการข้อมูลสินค้าไม่สำเร็จ');
      
      setSuccess(productModal.mode === 'add' ? 'เพิ่มสินค้าใหม่เรียบร้อยแล้ว' : 'แก้ไขข้อมูลสินค้าสำเร็จ');
      setProductModal({ ...productModal, isOpen: false });
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) { setError(err.message); }
  };

  const executeDeleteProduct = async () => {
    try {
      const response = await fetch(`${API_URL}/products/${deleteConfirm.targetId}`, { 
          method: 'DELETE', 
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } 
      });
      if (!response.ok) throw new Error('ไม่สามารถลบสินค้าออกจากคลังได้');
      setSuccess('ลบสินค้าเรียบร้อยแล้ว');
      setDeleteConfirm({ isOpen: false, targetId: null, targetName: '' });
      fetchData(); 
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) { setError(err.message); setDeleteConfirm({ isOpen: false, targetId: null, targetName: '' }); }
  };

  const handleOpenDiscountManager = (product) => {
    setDiscountProduct(product);
    setIsDiscountManagerOpen(true);
  };

  const handleCloseDiscountManager = () => {
    setDiscountProduct(null);
    setIsDiscountManagerOpen(false);
  };

  const handleSaveDiscount = async ({ discountType, discountValue }) => {
    setError(null);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/products/${discountProduct.id}/discount`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ discountType, discountValue })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'อัปเดตส่วนลดไม่สำเร็จ');

      setSuccess('ตั้งส่วนลดสินค้าสำเร็จแล้ว');
      setIsDiscountManagerOpen(false);
      setDiscountProduct(null);
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // กรองข้อมูลค้นหา
  const filteredOrders = orders.filter(o => getSafeEmail(o).toLowerCase().includes(searchTerm.toLowerCase()) || (o.id || '').toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredProducts = products.filter(p => (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (p.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) || (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredUsers = users.filter(u => (u.name || u.username || '').toLowerCase().includes(searchTerm.toLowerCase()) || (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()));
  
  const paidOrders = orders.filter(o => o.paymentStatus === 'Paid' || o.paymentStatus === 'ชำระเงินสำเร็จ');
  const totalSales = paidOrders.reduce((sum, o) => sum + getSafeTotal(o), 0);
  const pendingSlipCount = orders.filter(o => getThaiStatus(o.paymentStatus, o.orderStatus) === 'ได้รับออเดอร์').length;

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#F8F6F3', minHeight: '100vh', color: '#5C4E43' }}>
      <div style={{ padding: '32px 40px', maxWidth: '1240px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '900', margin: 0, letterSpacing: '0.5px', color: '#5C4E43' }}>Admin Panel</h1>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
          {['dashboard', 'products', 'orders', 'users', 'reviews', 'promotions'].map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setSearchTerm(''); }}
              style={{ padding: '10px 24px', borderRadius: '50px', border: activeTab === tab ? 'none' : '1px solid #E8E1D9', backgroundColor: activeTab === tab ? '#8C7A6B' : '#ffffff', color: activeTab === tab ? '#ffffff' : '#8C7A6B', fontWeight: '700', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize' }}
            >
              {tab === 'users' ? 'Manage Users' : tab}
            </button>
          ))}
        </div>

        {/* Alerts */}
        {success && <div style={{ padding: '16px', backgroundColor: '#8C7A6B', color: '#ffffff', marginBottom: '24px', fontWeight: 'bold', fontSize: '14px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>✓ {success}</div>}
        {error && <div style={{ padding: '16px', backgroundColor: '#b87373', color: '#ffffff', marginBottom: '24px', fontWeight: 'bold', fontSize: '14px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>⚠️ ข้อผิดพลาด: {error}</div>}

        {/* Search Input */}
        {activeTab !== 'dashboard' && activeTab !== 'reviews' && activeTab !== 'promotions' && (
          <div style={{ marginBottom: '24px' }}>
            <input type="text" 
              placeholder={
                activeTab === 'products' ? " ค้นหารหัส, ชื่อ, แบรนด์..." : 
                activeTab === 'orders' ? " ค้นหาตามเลขออเดอร์ หรืออีเมล..." : 
                " ค้นหาชื่อ หรืออีเมลผู้ใช้งาน..."
              } 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              style={{ width: '100%', maxWidth: '400px', padding: '12px 20px', border: '1px solid #E8E1D9', borderRadius: '50px', fontSize: '14px', outline: 'none', backgroundColor: '#ffffff', color: '#5C4E43' }} 
            />
          </div>
        )}

        {/* ======================= Dashboard (อัปเกรดดีไซน์ใหม่) ======================= */}
        {activeTab === 'dashboard' && (
          <>
            <style>{`
              .stat-card {
                background-color: #ffffff;
                padding: 24px;
                border: 1px solid #E8E1D9;
                border-radius: 20px;
                box-shadow: 0 4px 6px -1px rgba(92, 78, 67, 0.05), 0 2px 4px -1px rgba(92, 78, 67, 0.03);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                position: relative;
                overflow: hidden;
              }
              .stat-card:hover {
                transform: translateY(-6px);
                box-shadow: 0 12px 24px -4px rgba(92, 78, 67, 0.12), 0 8px 12px -6px rgba(92, 78, 67, 0.08);
                border-color: #D5CCC3;
              }
              .icon-wrapper {
                width: 48px;
                height: 48px;
                border-radius: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
              }
            `}</style>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
              {[
                { 
                  title: 'ยอดขายสุทธิทั้งหมด', 
                  value: `฿${totalSales.toLocaleString('th-TH')}`, 
                  unit: '',
                  color: '#10B981', bg: '#D1FAE5',
                  icon: <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                }, 
                { 
                  title: 'จำนวนคำสั่งซื้อรวม', 
                  value: orders.length, 
                  unit: 'ออเดอร์',
                  color: '#3B82F6', bg: '#DBEAFE',
                  icon: <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                }, 
                { 
                  title: 'ได้รับออเดอร์แล้ว', 
                  value: pendingSlipCount, 
                  unit: 'รายการ',
                  color: '#F59E0B', bg: '#FEF3C7',
                  icon: <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                }, 
                { 
                  title: 'สมาชิกในระบบ', 
                  value: users.length, 
                  unit: 'คน',
                  color: '#8B5CF6', bg: '#EDE9FE',
                  icon: <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                }, 
                { 
                  title: 'รองเท้าในระบบคลัง', 
                  value: products.length, 
                  unit: 'รายการ',
                  color: '#EC4899', bg: '#FCE7F3',
                  icon: <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                }
              ].map((stat, i) => (
                <div key={i} className="stat-card">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div className="icon-wrapper" style={{ backgroundColor: stat.bg, color: stat.color }}>
                      {stat.icon}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '13px', color: '#8C7A6B', fontWeight: 'bold', letterSpacing: '0.5px' }}>{stat.title}</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
                      <h3 style={{ fontSize: '32px', fontWeight: '950', color: '#5C4E43', margin: 0, lineHeight: '1.1' }}>
                        {stat.value}
                      </h3>
                      {stat.unit && (
                        <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#A69B91' }}>
                          {stat.unit}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ======================= Products ======================= */}
        {activeTab === 'products' && (
          <div>
            <div onClick={() => productModal.isOpen && productModal.mode === 'add' ? setProductModal({ ...productModal, isOpen: false }) : openAddProductModal()} 
                 style={{ backgroundColor: '#ffffff', border: '1px solid #E8E1D9', borderRadius: '16px', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: productModal.isOpen && productModal.mode === 'add' ? '16px' : '32px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#8C7A6B', fontWeight: 'bold', fontSize: '15px' }}>เพิ่มสินค้าใหม่</span>
              </div>
              <span style={{ color: '#8C7A6B' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {productModal.isOpen && productModal.mode === 'add' ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
                </svg>
              </span>
            </div>

            {/* ฟอร์มเพิ่ม/แก้ไขสินค้า */}
            {productModal.isOpen && (
              <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #E8E1D9', padding: '24px', marginBottom: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8C7A6B', marginBottom: '6px' }}>ชื่อรุ่นรองเท้า</label>
                    <input required type="text" value={productModal.name} onChange={e => setProductModal({...productModal, name: e.target.value})} style={{ width: '100%', padding: '12px 16px', border: '1px solid #E8E1D9', borderRadius: '12px', outline: 'none', color: '#5C4E43' }} placeholder="เช่น Samba OG Shoes" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8C7A6B', marginBottom: '6px' }}>แบรนด์สินค้า</label>
                      {!productModal.isCustomBrand ? (
                        <select value={productModal.brand} onChange={e => { if (e.target.value === 'ADD_NEW') { setProductModal(prev => ({ ...prev, isCustomBrand: true, brand: '' })); } else { const newBrand = e.target.value; setProductModal(prev => ({ ...prev, brand: newBrand, sku: prev.mode === 'add' ? generateSKU(newBrand) : prev.sku })); } }} style={{ width: '100%', padding: '12px 16px', border: '1px solid #E8E1D9', borderRadius: '12px', outline: 'none', backgroundColor: '#ffffff', color: '#5C4E43' }}>
                          {uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}
                          <option value="ADD_NEW">➕ เพิ่มแบรนด์ใหม่...</option>
                        </select>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input autoFocus type="text" placeholder="พิมพ์แบรนด์ใหม่..." value={productModal.brand} onChange={e => { const newBrand = e.target.value; setProductModal(prev => ({ ...prev, brand: newBrand, sku: prev.mode === 'add' ? generateSKU(newBrand) : prev.sku })); }} style={{ flex: 1, padding: '12px 16px', border: '1px solid #E8E1D9', borderRadius: '12px', outline: 'none', color: '#5C4E43' }} />
                          <button type="button" onClick={() => { const fallback = uniqueBrands.includes(productModal.brand) && productModal.brand !== '' ? productModal.brand : uniqueBrands[0]; setProductModal(prev => ({ ...prev, isCustomBrand: false, brand: fallback, sku: prev.mode === 'add' ? generateSKU(fallback) : prev.sku })); }} style={{ padding: '0 16px', backgroundColor: '#F0EBE6', border: 'none', borderRadius: '12px', color: '#8C7A6B', fontWeight: 'bold', cursor: 'pointer' }}>ยกเลิก</button>
                        </div>
                      )}
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8C7A6B', marginBottom: '6px' }}>ราคา (บาท)</label>
                      <input required type="number" value={productModal.price} onChange={e => setProductModal({...productModal, price: e.target.value})} style={{ width: '100%', padding: '12px 16px', border: '1px solid #E8E1D9', borderRadius: '12px', outline: 'none', color: '#5C4E43' }} placeholder="3500" />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8C7A6B', marginBottom: '6px' }}>รหัส SKU (สร้างอัตโนมัติ)</label>
                      <input disabled type="text" value={productModal.sku} style={{ width: '100%', padding: '12px 16px', border: '1px solid #E8E1D9', borderRadius: '12px', outline: 'none', backgroundColor: '#F8F6F3', color: '#8C7A6B', cursor: 'not-allowed', fontWeight: 'bold' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8C7A6B', marginBottom: '6px' }}>โทนสีสินค้า</label>
                      <input type="text" value={productModal.color} onChange={e => setProductModal({...productModal, color: e.target.value})} style={{ width: '100%', padding: '12px 16px', border: '1px solid #E8E1D9', borderRadius: '12px', outline: 'none', color: '#5C4E43' }} placeholder="White/Black/Gum" />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8C7A6B', marginBottom: '6px' }}>ภาพลิงก์พรีวิว URL</label>
                      <input type="text" value={productModal.image} onChange={e => setProductModal({...productModal, image: e.target.value})} style={{ width: '100%', padding: '12px 16px', border: '1px solid #E8E1D9', borderRadius: '12px', outline: 'none', color: '#5C4E43' }} placeholder="วางลิงก์รูปภาพที่นี่" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8C7A6B', marginBottom: '6px' }}>วันที่วางจำหน่าย</label>
                      <input type="text" value={productModal.releaseDate} onChange={e => setProductModal({...productModal, releaseDate: e.target.value})} style={{ width: '100%', padding: '12px 16px', border: '1px solid #E8E1D9', borderRadius: '12px', outline: 'none', color: '#5C4E43' }} placeholder="เช่น 19/07/2569" />
                    </div>
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8C7A6B', marginBottom: '6px' }}>ชนิดส่วนลด</label>
                      <select value={productModal.discountType} onChange={e => setProductModal({...productModal, discountType: e.target.value})} style={{ width: '100%', padding: '12px 16px', border: '1px solid #E8E1D9', borderRadius: '12px', backgroundColor: '#ffffff', outline: 'none', color: '#5C4E43' }}>
                        <option value="fixed">ลดเป็นบาท</option>
                        <option value="percentage">ลดเป็นเปอร์เซ็นต์</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8C7A6B', marginBottom: '6px' }}>มูลค่าส่วนลด</label>
                      <input type="number" min="0" value={productModal.discountValue} onChange={e => setProductModal({...productModal, discountValue: e.target.value})} style={{ width: '100%', padding: '12px 16px', border: '1px solid #E8E1D9', borderRadius: '12px', outline: 'none', color: '#5C4E43' }} placeholder="0" />
                      <div style={{ fontSize: '11px', color: '#8C7A6B', marginTop: '4px' }}>
                        {productModal.discountType === 'percentage' ? 'เช่น 20 = ลด 20%' : 'เช่น 300 = ลด 300 บาท'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                    <button type="button" onClick={() => setProductModal({...productModal, isOpen: false})} style={{ padding: '12px 24px', border: '1px solid #8C7A6B', color: '#8C7A6B', backgroundColor: '#ffffff', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer' }}>ยกเลิก</button>
                    <button type="submit" style={{ padding: '12px 24px', border: 'none', backgroundColor: '#8C7A6B', color: '#ffffff', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer' }}>บันทึกลงระบบ</button>
                  </div>
                </form>
              </div>
            )}

            {/* ตารางสินค้า */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
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
                      <th style={{ padding: '18px 24px', fontSize: '13px', fontWeight: '900', color: '#5C4E43' }}>ส่วนลด</th>
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
                            {prod.image ? <img src={prod.image} alt={prod.name} style={{ width: '48px', height: '48px', objectFit: 'contain', backgroundColor: '#F8F6F3', border: '1px solid #E8E1D9', borderRadius: '8px' }} /> : <div style={{ width: '48px', height: '48px', backgroundColor: '#F8F6F3', borderRadius: '8px', border: '1px solid #E8E1D9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#8C7A6B' }}>No Pic</div>}
                          </td>
                          <td style={{ padding: '20px 24px' }}>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#5C4E43' }}>{prod.name}</div>
                            <div style={{ fontSize: '11px', color: '#8C7A6B' }}>สี: {prod.color || 'N/A'}</div>
                          </td>
                          <td style={{ padding: '20px 24px', fontSize: '14px', fontWeight: 'bold', color: '#8C7A6B' }}>{prod.brand}</td>
                          <td style={{ padding: '20px 24px', fontSize: '15px', fontWeight: '900', color: '#d97777' }}>฿{prod.price.toLocaleString()}</td>
                          <td style={{ padding: '20px 24px', fontSize: '14px', fontWeight: '700', color: prod.discountValue > 0 ? '#047857' : '#8C7A6B' }}>
                            {prod.discountValue > 0 ? (
                              <span>{prod.discountType === 'percentage' ? `${prod.discountValue}%` : `฿${prod.discountValue.toLocaleString()}`}</span>
                            ) : (
                              <span style={{ color: '#8C7A6B' }}>ไม่มีส่วนลด</span>
                            )}
                          </td>
                          <td style={{ padding: '20px 24px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <button type="button" onClick={() => openEditProductModal(prod)} style={{ padding: '6px 12px', border: '1px solid #8C7A6B', color: '#8C7A6B', backgroundColor: '#ffffff', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>แก้ไข</button>
                              <button type="button" onClick={() => handleOpenDiscountManager(prod)} style={{ padding: '6px 12px', border: '1px solid #2563EB', backgroundColor: '#ffffff', color: '#2563EB', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>ตั้งส่วนลด</button>
                              <button type="button" onClick={() => setDeleteConfirm({ isOpen: true, targetId: prod.id, targetName: prod.name })} style={{ padding: '6px 12px', border: '1px solid #d97777', backgroundColor: '#ffffff', color: '#d97777', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>ลบ</button>
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

        {/* ======================= Orders ======================= */}
        {activeTab === 'orders' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
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
                    {filteredOrders.length === 0 ? (
                      <tr><td colSpan="4" style={{ padding: '48px 24px', textAlign: 'center', color: '#8C7A6B' }}>📭 ไม่พบรายการคำสั่งซื้อ</td></tr>
                    ) : (
                      filteredOrders.map(order => {
                        const customerEmail = getSafeEmail(order);
                        const thaiStatus = getThaiStatus(order.paymentStatus, order.orderStatus);

                        return (
                          <tr key={order.id} style={{ borderBottom: '1px solid #F8F6F3', verticalAlign: 'middle' }}>
                            <td style={{ padding: '20px 24px', fontSize: '13px', color: '#8C7A6B', fontWeight: 'bold' }}>#{order.id}</td>
                            <td style={{ padding: '20px 24px', fontSize: '14px', color: '#5C4E43' }}>{customerEmail}</td>
                            <td style={{ padding: '20px 24px', fontSize: '15px', fontWeight: '900', color: '#5C4E43' }}>฿{getSafeTotal(order).toLocaleString()}</td>
                            <td style={{ padding: '20px 24px' }}>
                              <select 
                                value={thaiStatus}
                                onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                                disabled={updatingId === order.id}
                                style={getStatusSelectStyle(thaiStatus)}
                              >
                                <option value="ได้รับออเดอร์">ได้รับออเดอร์</option>
                                <option value="กำลังจัดเตรียม">กำลังจัดเตรียม</option>
                                <option value="ส่งพัสดุแล้ว">ส่งพัสดุแล้ว</option>
                                <option value="สำเร็จเรียบร้อย">สำเร็จเรียบร้อย</option>
                              </select>
                              {updatingId === order.id && <span style={{ marginLeft: '12px', fontSize: '12px', color: '#8C7A6B' }}>กำลังบันทึก...</span>}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ======================= Users ======================= */}
        {activeTab === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#5C4E43', margin: 0 }}>จัดการข้อมูลผู้ใช้งาน ({filteredUsers.length})</h3>
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#8C7A6B', fontSize: '14px', fontWeight: 'bold' }}>กำลังโหลดข้อมูลผู้ใช้งาน...</div>
            ) : (
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #E8E1D9', borderRadius: '16px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F0EBE6', borderBottom: '1px solid #E8E1D9' }}>
                      <th style={{ padding: '18px 24px', fontSize: '13px', fontWeight: '900', color: '#5C4E43' }}>ID</th>
                      <th style={{ padding: '18px 24px', fontSize: '13px', fontWeight: '900', color: '#5C4E43' }}>ชื่อผู้ใช้</th>
                      <th style={{ padding: '18px 24px', fontSize: '13px', fontWeight: '900', color: '#5C4E43' }}>อีเมล</th>
                      <th style={{ padding: '18px 24px', fontSize: '13px', fontWeight: '900', color: '#5C4E43' }}>สิทธิ์ (Role)</th>
                      <th style={{ padding: '18px 24px', fontSize: '13px', fontWeight: '900', color: '#5C4E43' }}>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr><td colSpan="5" style={{ padding: '48px 24px', textAlign: 'center', color: '#8C7A6B' }}>📭 ไม่พบข้อมูลผู้ใช้งาน</td></tr>
                    ) : (
                      filteredUsers.map(user => (
                        <tr key={user.id} style={{ borderBottom: '1px solid #F8F6F3', verticalAlign: 'middle' }}>
                          <td style={{ padding: '20px 24px', fontSize: '13px', color: '#8C7A6B', fontWeight: 'bold' }}>#{user.id}</td>
                          <td style={{ padding: '20px 24px', fontSize: '14px', color: '#5C4E43', fontWeight: 'bold' }}>{user.name}</td>
                          <td style={{ padding: '20px 24px', fontSize: '14px', color: '#5C4E43' }}>{user.email}</td>
                          <td style={{ padding: '20px 24px' }}>
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleUpdate(user.id, e.target.value)}
                              style={getRoleSelectStyle(user.role)}
                            >
                              <option value="customer">Customer</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td style={{ padding: '20px 24px' }}>
                            <button onClick={() => setUserDeleteConfirm({ isOpen: true, targetId: user.id, targetName: user.name })} style={{ padding: '8px 16px', border: '1px solid #d97777', backgroundColor: '#ffffff', color: '#d97777', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>ลบบัญชี</button>
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

        {/* ======================= Reviews ======================= */}
        {activeTab === 'reviews' && (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #E8E1D9', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <ManageReviews />
          </div>
        )}

        {/* ======================= Promotions ======================= */}
        {activeTab === 'promotions' && (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #E8E1D9', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <ManagePromotions />
          </div>
        )}

        {/* ======================= Modals (ยืนยันการลบ) ======================= */}
        {/* Modal: ลบสินค้า */}
        {deleteConfirm.isOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
            <div style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>🗑️</div>
              <h3 style={{ margin: '0 0 8px 0', color: '#5C4E43', fontSize: '20px', fontWeight: 'bold' }}>ยืนยันการลบสินค้า</h3>
              <p style={{ margin: '0 0 24px 0', color: '#8C7A6B', fontSize: '14px' }}>คุณต้องการลบ <b>"{deleteConfirm.targetName}"</b> ออกจากคลังใช่หรือไม่?</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button onClick={() => setDeleteConfirm({ isOpen: false, targetId: null, targetName: '' })} style={{ padding: '12px 24px', border: '1px solid #E8E1D9', backgroundColor: '#F0EBE6', color: '#5C4E43', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer', flex: 1 }}>ยกเลิก</button>
                <button onClick={executeDeleteProduct} style={{ padding: '12px 24px', border: 'none', backgroundColor: '#d97777', color: '#fff', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer', flex: 1 }}>ยืนยันลบ</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: ลบผู้ใช้งาน */}
        {userDeleteConfirm.isOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
            <div style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>🚨</div>
              <h3 style={{ margin: '0 0 8px 0', color: '#5C4E43', fontSize: '20px', fontWeight: 'bold' }}>ยืนยันการลบผู้ใช้</h3>
              <p style={{ margin: '0 0 24px 0', color: '#8C7A6B', fontSize: '14px' }}>คุณกำลังจะลบผู้ใช้ <b>"{userDeleteConfirm.targetName}"</b> การกระทำนี้ไม่สามารถย้อนกลับได้ ดำเนินการต่อหรือไม่?</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button onClick={() => setUserDeleteConfirm({ isOpen: false, targetId: null, targetName: '' })} style={{ padding: '12px 24px', border: '1px solid #E8E1D9', backgroundColor: '#F0EBE6', color: '#5C4E43', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer', flex: 1 }}>ยกเลิก</button>
                <button onClick={executeDeleteUser} style={{ padding: '12px 24px', border: 'none', backgroundColor: '#d97777', color: '#fff', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer', flex: 1 }}>ยืนยันลบผู้ใช้</button>
              </div>
            </div>
          </div>
        )}

        {isDiscountManagerOpen && (
          <ProductDiscountManager
            product={discountProduct}
            onClose={handleCloseDiscountManager}
            onSave={handleSaveDiscount}
          />
        )}

      </div>
    </div>
  );
}