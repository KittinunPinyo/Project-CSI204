// ==========================================
// 1. นำเข้าไลบรารีที่จำเป็น
// ==========================================
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// ==========================================
// 2. ตั้งค่า Middleware
// ==========================================
app.use(cors());
app.use(express.json());

// ==========================================
// 3. ตั้งค่าการเชื่อมต่อฐานข้อมูล
// ==========================================
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const JWT_SECRET = 'KICKZONE_SECRET_KEY';

// Middleware ตรวจ Token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'ไม่พบ Token' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token ไม่ถูกต้อง' });
        req.user = user;
        next();
    });
};

// ==========================================
// 5. API Routes
// ==========================================

// ล็อกอิน
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0 || password !== result.rows[0].password) {
            return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }
        const user = result.rows[0];
        const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err) { res.status(500).json({ error: 'Server Error' }); }
});

// ดึงสินค้าทั้งหมด
app.get('/api/products', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: 'ดึงข้อมูลไม่ได้' }); }
});

// 🔴 เพิ่มสินค้าใหม่ (รองรับฟิลด์ใหม่: sku, color, release_date, stock)
app.post('/api/products', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin เท่านั้น' });
    const { name, brand, price, image, sku, color, releaseDate, stock } = req.body;

    try {
        const result = await pool.query(
            'INSERT INTO products (name, brand, price, image, sku, color, release_date, stock) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [name, brand, price, image, sku, color, releaseDate, JSON.stringify(stock)]
        );
        res.status(201).json({ message: 'เพิ่มสินค้าเรียบร้อย', product: result.rows[0] });
    } catch (err) {
        console.error("SQL Error (Add):", err); 
        res.status(500).json({ error: 'เพิ่มสินค้าไม่ได้' });
    }
});

// 🔴 แก้ไขสินค้า (รองรับฟิลด์ใหม่: sku, color, release_date, stock)
app.put('/api/products/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'ไม่มีสิทธิ์' });
    const { id } = req.params;
    const { name, brand, price, image, sku, color, releaseDate, stock } = req.body;

    try {
        const result = await pool.query(
            'UPDATE products SET name=$1, brand=$2, price=$3, image=$4, sku=$5, color=$6, release_date=$7, stock=$8 WHERE id=$9 RETURNING *',
            [name, brand, price, image, sku, color, releaseDate, JSON.stringify(stock), id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'แก้ไขไม่สำเร็จ' });
    }
});

// ลบสินค้า
app.delete('/api/products/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'ไม่มีสิทธิ์' });
    try {
        await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
        res.json({ message: 'ลบสำเร็จ' });
    } catch (err) { res.status(500).json({ error: 'ลบไม่สำเร็จ' }); }
});

// ==========================================
// 6. เปิด Server
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));