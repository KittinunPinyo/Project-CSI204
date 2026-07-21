import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';

import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Register from './pages/Register';
import Cart from './pages/Cart';
import ProductDetail from './pages/ProductDetail';
import Profile from './pages/Profile';
import ManageReviews from './pages/ManageReviews';

export default function App() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser).role : null; 
  });

  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem("cart")) || []);
  const [wishlist, setWishlist] = useState(() => JSON.parse(localStorage.getItem("wishlist")) || []);
  const [searchQuery, setSearchQuery] = useState("");
  
  // 🔴 ปรับ State เริ่มต้นให้รองรับฟิลด์ใหม่ทั้งหมด
  const [newProduct, setNewProduct] = useState({ 
    name: "", brand: "", price: "", image: "", 
    sku: "", color: "", releaseDate: "", stock: {},
    discountType: 'fixed',
    discountValue: 0
  });

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]); 

  useEffect(() => {
    const fetchData = async () => {
      try {
        const prodRes = await fetch('http://localhost:5000/api/products');
        const prodData = await prodRes.json();
        setProducts(prodData.map(p => ({ 
          ...p, 
          id: p.id.toString(), 
          price: Number(p.price),
          discountType: p.discount_type || p.discountType || 'fixed',
          discountValue: Number(p.discount_value ?? p.discountValue ?? 0),
          // ตรวจสอบว่า stock เป็น Object หรือยัง
          stock: typeof p.stock === 'string' ? JSON.parse(p.stock) : (p.stock || {})
        })));

        const ordRes = await fetch('http://localhost:5000/api/orders');
        const ordData = await ordRes.json();
        setOrders(ordData);
      } catch (error) { console.error("Error fetching data:", error); }
    };
    fetchData();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // 🟢 ฟังก์ชันเพิ่มสินค้า (ส่งข้อมูลครบทุกฟิลด์)
  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/products', { 
        method: 'POST', 
        headers: getAuthHeaders(), 
        body: JSON.stringify(newProduct) 
      });
      if (!res.ok) throw new Error("เกิดข้อผิดพลาดจากเซิร์ฟเวอร์");
      
      const data = await res.json();
      const added = data.product; 

      setProducts([{...added, id: added.id.toString(), price: Number(added.price), discountType: added.discount_type || added.discountType || 'fixed', discountValue: Number(added.discount_value ?? added.discountValue ?? 0), stock: added.stock}, ...products]);
      alert("เพิ่มสินค้าสำเร็จ!");
    } catch (err) { 
      console.error(err);
      alert("เกิดข้อผิดพลาดในการเพิ่มสินค้า"); 
    }
  };

  // 🟢 ฟังก์ชันแก้ไขสินค้า (ส่งข้อมูลครบทุกฟิลด์)
  const handleEditProduct = async (updatedProduct) => {
    try {
      const res = await fetch(`http://localhost:5000/api/products/${updatedProduct.id}`, { 
        method: 'PUT', 
        headers: getAuthHeaders(), 
        body: JSON.stringify(updatedProduct) 
      });
      if (!res.ok) throw new Error("เกิดข้อผิดพลาด");
      
      const data = await res.json();
      setProducts(products.map(p => p.id === updatedProduct.id ? {
        ...data,
        id: data.id.toString(),
        price: Number(data.price),
        discountType: data.discount_type || data.discountType || 'fixed',
        discountValue: Number(data.discount_value ?? data.discountValue ?? 0),
        stock: data.stock
      } : p));
      alert("อัปเดตข้อมูลสำเร็จ!");
    } catch (err) { 
      console.error(err);
      alert("เกิดข้อผิดพลาดในการแก้ไขสินค้า"); 
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("ต้องการลบสินค้านี้ใช่หรือไม่?")) {
      try {
        const res = await fetch(`http://localhost:5000/api/products/${id}`, { 
          method: 'DELETE', 
          headers: getAuthHeaders() 
        });
        if (!res.ok) throw new Error("เกิดข้อผิดพลาด");
        setProducts(products.filter(p => p.id !== id));
      } catch (err) { alert("เกิดข้อผิดพลาดในการลบสินค้า"); }
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return alert("ไม่มีสินค้าในตะกร้า!");
    const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const userEmail = savedUser.email || "customer@kickzone.com"; 
    
    const newOrder = {
      id: 'KZ-' + Date.now().toString().slice(-6),
      customer_email: userEmail,
      order_date: new Date().toLocaleDateString('th-TH'),
      items: cart,
      total: cart.reduce((sum, item) => sum + Number(item.price), 0),
      status: 'รอชำระเงิน'
    };

    try {
      const res = await fetch('http://localhost:5000/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newOrder) });
      const savedOrder = await res.json();
      setOrders([savedOrder, ...orders]);
      let clearCart = [];
      setCart(clearCart);
      alert("ชำระเงินสำเร็จ!");
      navigate('/profile');
    } catch (err) { alert("เกิดข้อผิดพลาดในการสั่งซื้อ"); }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await fetch(`http://localhost:5000/api/orders/${orderId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) { alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ"); }
  };

  useEffect(() => { localStorage.setItem("cart", JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem("wishlist", JSON.stringify(wishlist)); }, [wishlist]);

  const computeDiscountedProductPrice = (product) => {
    const basePrice = Number(product.price) || 0;
    const value = Number(product.discountValue || 0);
    if (product.discountType === 'percentage') {
      return Math.max(0, Math.round(basePrice * (1 - value / 100)));
    }
    return Math.max(0, Math.round(basePrice - value));
  };

  const handleAddToCart = (product) => {
    const basePrice = product.originalPrice != null ? Number(product.originalPrice) : Number(product.price);
    const discountedPrice = computeDiscountedProductPrice({ ...product, price: basePrice });
    setCart([...cart, { ...product, price: discountedPrice, originalPrice: basePrice }]);
    alert(`เพิ่ม ${product.name} ลงตะกร้าแล้ว!`);
  };
  const toggleWishlist = (product) => {
    if (currentUser !== 'customer') return alert("กรุณาเข้าสู่ระบบก่อนครับ");
    const isExist = wishlist.find(item => item.id === product.id);
    setWishlist(isExist ? wishlist.filter(item => item.id !== product.id) : [...wishlist, product]);
  };

  const filteredProducts = products.filter(p => (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) || (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase())));

  return (
    <div className="min-vh-100 bg-white">
      <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} cart={cart} />
      <Routes>
        <Route path="/" element={<Home filteredProducts={filteredProducts} currentUser={currentUser} handleAddToCart={handleAddToCart} wishlist={wishlist} toggleWishlist={toggleWishlist} />} />
        <Route path="/product/:id" element={<ProductDetail products={products} currentUser={currentUser} handleAddToCart={handleAddToCart} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/cart" element={<Cart cart={cart} setCart={setCart} currentUser={currentUser} handleCheckout={handleCheckout} />} />
        <Route path="/profile" element={<Profile currentUser={currentUser} orders={orders} />} />
        <Route path="/admin" element={
          <Admin 
            currentUser={currentUser} products={products} newProduct={newProduct} setNewProduct={setNewProduct} 
            handleAddProduct={handleAddProduct} handleDeleteProduct={handleDeleteProduct} handleEditProduct={handleEditProduct}
            orders={orders} handleUpdateOrderStatus={handleUpdateOrderStatus} 
          />
        } />
        <Route path="/admin/reviews" element={<ManageReviews />} />
      </Routes>
    </div>
  );
}