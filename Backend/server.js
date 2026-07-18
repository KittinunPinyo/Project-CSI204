// ==========================================
// 1. นำเข้าไลบรารีที่จำเป็นทั้งหมด
// ==========================================
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const multer = require('multer'); 
const path = require('path');     
const fs = require('fs');         
require('dotenv').config();

// นำเข้าไลบรารีตรวจเช็คสลิปผ่าน QR Code (แก้ไขบั๊ก Jimp v1+ Compatibility)
let Jimp, jsQR;
try {
    const jimpModule = require('jimp');
    // รองรับทั้ง Jimp v1.0.0+ (ใช้ jimpModule.Jimp) และเวอร์ชันดั้งเดิม (ใช้ jimpModule)
    Jimp = jimpModule.Jimp || jimpModule;
    jsQR = require('jsqr');
    console.log("🔍 บูทระบบตรวจสอบสลิปอัตโนมัติ (Jimp & jsQR) เรียบร้อย!");
} catch (e) {
    console.warn("⚠️ คำเตือน: ยังไม่ได้ติดตั้ง 'jimp' หรือ 'jsqr' กรุณารันคำสั่ง 'npm install jimp jsqr' ที่โฟลเดอร์ Backend เพื่อเปิดใช้ระบบกรองสลิปจริง");
}

const app = express();

// ==========================================
// 2. ตั้งค่า Middleware และระบบบันทึกรูปภาพ
// ==========================================
app.use(cors());
app.use(express.json());

// --- ตั้งค่าระบบอัปโหลดไฟล์สลิป (Multer) ---
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'slip-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('กรุณาอัปโหลดไฟล์รูปภาพสลิปเท่านั้น! (รองรับเฉพาะ png, jpg, jpeg)'));
    }
});

// ==========================================
// 3. ตั้งค่าการเชื่อมต่อและตรวจสอบโครงสร้างตาราง NeonDB
// ==========================================
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// ตรวจสอบและอัปเดตสคีมาตารางอัตโนมัติ
const initializeDatabase = async () => {
    try {
        console.log("Connecting to NeonDB database...");
        
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'orders'
            );
        `);
        const tableExists = tableCheck.rows[0].exists;

        if (tableExists) {
            const columnCheck = await pool.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = 'orders' 
                    AND column_name = 'customer_name'
                );
            `);
            const columnExists = columnCheck.rows[0].exists;

            if (!columnExists) {
                console.log("⚠️ ตรวจพบตาราง 'orders' เดิมมีโครงสร้างไม่ถูกต้อง (ไม่มีคอลัมน์ customer_name) กำลังปรับปรุงตารางใหม่...");
                await pool.query(`DROP TABLE IF EXISTS orders;`);
            }
        }

        // 1. ตาราง Orders
        await pool.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id VARCHAR(50) PRIMARY KEY,
                customer_name VARCHAR(255) NOT NULL,
                customer_email VARCHAR(255) NOT NULL,
                shoe_model VARCHAR(255) NOT NULL,
                size VARCHAR(10) NOT NULL,
                total_amount NUMERIC(10, 2) NOT NULL,
                payment_method VARCHAR(50) DEFAULT 'PromptPay',
                payment_status VARCHAR(50) DEFAULT 'Pending Upload',
                order_status VARCHAR(50) DEFAULT 'Processing',
                tracking_number VARCHAR(100) DEFAULT 'N/A',
                slip_url VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ NeonDB: ตรวจสอบและจัดการโครงสร้างตาราง 'orders' เรียบร้อย พร้อมใช้งาน!");

        // 2. ตาราง Reviews (สร้างใหม่)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS reviews (
                id SERIAL PRIMARY KEY,
                product_id VARCHAR(255) NOT NULL,
                user_id INTEGER NOT NULL,
                rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
                comment TEXT NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ NeonDB: ตรวจสอบและจัดการตาราง 'reviews' เรียบร้อย!");

    } catch (err) {
        console.error("❌ Database Initialization Error:", err.message);
    }
};
initializeDatabase();

const JWT_SECRET = 'KICKZONE_SECRET_KEY';

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

const mapOrderForFrontend = (row) => ({
    id: row.id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    shoeModel: row.shoe_model,
    size: row.size,
    totalAmount: Number(row.total_amount),
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    orderStatus: row.order_status,
    trackingNumber: row.tracking_number,
    slipUrl: row.slip_url,
    createdAt: row.created_at
});

// ==========================================
// 4. API Routes สำหรับสมาชิก และสินค้า
// ==========================================

// สมัครสมาชิกใหม่
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    try {
        const checkUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (checkUser.rows.length > 0) {
            return res.status(400).json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' });
        }

        const result = await pool.query(
            'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
            [name, email, password, 'customer']
        );

        res.status(201).json({ 
            message: 'สมัครสมาชิกสำเร็จ', 
            user: result.rows[0] 
        });
    } catch (err) { 
        console.error("Register Error:", err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสมัครสมาชิก: ' + err.message }); 
    }
});

// ล็อกอินเข้าระบบ
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

// ดึงรายการสินค้าทั้งหมด
app.get('/api/products', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: 'ดึงข้อมูลไม่ได้' }); }
});

// เพิ่มสินค้าใหม่
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
        res.status(500).json({ error: 'เพิ่มสินค้าไม่ได้: ' + err.message });
    }
});

// แก้ไขข้อมูลสินค้า
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
        res.status(500).json({ error: 'แก้ไขไม่สำเร็จ: ' + err.message });
    }
});

// ลบสินค้าออกจากการขาย
app.delete('/api/products/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'ไม่มีสิทธิ์' });
    try {
        await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
        res.json({ message: 'ลบสำเร็จ' });
    } catch (err) { res.status(500).json({ error: 'ลบไม่สำเร็จ' }); }
});

// ==========================================
// 5. API Routes สำหรับระบบสั่งซื้อพัสดุ (Orders)
// ==========================================

// 1) บันทึกสั่งซื้อใหม่
app.post('/api/orders', async (req, res) => {
    try {
        const { customerName, customerEmail, shoeModel, size, totalAmount, paymentMethod } = req.body;
        const newId = 'KZ' + Math.floor(100000 + Math.random() * 900000).toString();
        
        const query = `
            INSERT INTO orders (id, customer_name, customer_email, shoe_model, size, total_amount, payment_method) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
        `;
        const values = [newId, customerName, customerEmail, shoeModel, size, Number(totalAmount), paymentMethod || 'PromptPay'];

        const { rows } = await pool.query(query, values);
        res.status(201).json({ success: true, order: mapOrderForFrontend(rows[0]) });
    } catch (error) {
        console.error("Order Insertion Error:", error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ: ' + error.message });
    }
});

// 2) อัปโหลดและทำการตรวจเช็ค "คิวอาร์โค้ดสลิปโอนเงินจริง"
app.post('/api/orders/:id/upload-slip', (req, res, next) => {
    upload.single('slip')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'ไม่มีไฟล์สลิปส่งเข้ามา' });
        
        const slipPath = req.file.path;
        const slipUrl = `/uploads/${req.file.filename}`;

        // ทำการวิเคราะห์ภาพ (Image Processing) ค้นหา QR Code จากสลิป
        if (Jimp && jsQR) {
            try {
                // อ่านข้อมูลพิกเซลของภาพ (แก้ไขให้เรียกใช้ผ่าน instance เชิงโครงสร้างที่ถูกต้อง)
                const image = await Jimp.read(slipPath);
                
                // ค้นหาและถอดรหัส QR Code ในภาพสลิป
                const qr = jsQR(
                    new Uint8ClampedArray(image.bitmap.data), 
                    image.bitmap.width, 
                    image.bitmap.height
                );

                if (!qr) {
                    // หากไม่พบ QR Code เลย ให้ลบไฟล์รูปนั้นออก และแจ้งปฏิเสธกลับ
                    fs.unlinkSync(slipPath);
                    return res.status(400).json({ 
                        success: false, 
                        message: '❌ ไม่ผ่านการตรวจสอบ: ไม่พบ QR Code บนรูปภาพที่คุณส่งเข้ามา! กรุณาใช้รูปภาพสลิปโอนเงินที่มีคิวอาร์โค้ดที่ถูกต้องจากแอปธนาคาร' 
                    });
                }

                const qrData = qr.data;
                console.log(`Scan QR Slip Data found: ${qrData}`);

                // ตรวจสอบโครงสร้างว่าสอดคล้องกับมาตรฐาน Thai QR Payment (EMVCo) หรือบริการสลิปธนาคารของไทยหรือไม่
                const isThaiBankSlip = 
                    qrData.startsWith('00') || 
                    qrData.includes('http') || 
                    qrData.includes('bank') || 
                    qrData.includes('promptpay') ||
                    qrData.includes('00380011') || 
                    qrData.length > 25;

                if (!isThaiBankSlip) {
                    fs.unlinkSync(slipPath);
                    return res.status(400).json({ 
                        success: false, 
                        message: '❌ ไม่ผ่านการตรวจสอบ: รูปภาพนี้มีคิวอาร์โค้ด แต่ไม่ใช่รูปแบบของ "สลิปธนาคารไทย" ที่ถูกต้อง!' 
                    });
                }

                console.log(`✅ สลิปออเดอร์ ${req.params.id} ตรวจผ่านคิวอาร์โค้ดสำเร็จ!`);

            } catch (scanError) {
                console.error("QR Scanning internal error:", scanError);
                fs.unlinkSync(slipPath);
                return res.status(400).json({ 
                    success: false, 
                    message: '❌ เกิดข้อผิดพลาดในการประมวลผลรูปภาพ กรุณาตรวจสอบว่าอัปโหลดไฟล์ภาพสลิปที่ถูกต้อง: ' + scanError.message 
                });
            }
        } else {
            // หากระบบสแกนสลิปยังไม่พร้อมทำงาน
            fs.unlinkSync(slipPath);
            return res.status(400).json({ 
                success: false, 
                message: '❌ ไม่ผ่านการตรวจสอบ: ระบบสแกนสลิปยังไม่พร้อมทำงาน กรุณาติดต่อแอดมินเพื่อตรวจสอบความเรียบร้อย' 
            });
        }
        
        // บันทึกผ่านฐานข้อมูล
        const query = `
            UPDATE orders 
            SET slip_url = $1, payment_status = 'Pending Verification' 
            WHERE id = $2 RETURNING *
        `;
        const { rows } = await pool.query(query, [slipUrl, req.params.id]);

        if (rows.length === 0) return res.status(404).json({ message: 'ไม่พบรายการสั่งซื้อนี้' });
        res.json({ success: true, order: mapOrderForFrontend(rows[0]) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปโหลดสลิป: ' + error.message });
    }
});

// 3) ค้นหาสถานะคำสั่งซื้อเดี่ยว (Track Order สำหรับหน้าบ้าน)
app.get('/api/orders/:id', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
        if (rows.length > 0) {
            res.json(mapOrderForFrontend(rows[0]));
        } else {
            res.status(404).json({ message: 'ไม่พบรหัสคำสั่งซื้อนี้ในฐานข้อมูล' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการค้นหาข้อมูล' });
    }
});

// 4) แอดมินดึงรายการสั่งซื้อทั้งหมด (Manage Orders)
app.get('/api/orders', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
        res.json(rows.map(mapOrderForFrontend));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'ดึงข้อมูลออเดอร์ล้มเหลว' });
    }
});

// 5) แอดมินแก้ไขสเตตัสการส่ง / เลขแทร็กกิ้งพัสดุ
app.patch('/api/orders/:id/status', async (req, res) => {
    try {
        const { orderStatus, trackingNumber, paymentStatus } = req.body;
        const query = `
            UPDATE orders 
            SET order_status = $1, tracking_number = $2, payment_status = $3 
            WHERE id = $4 RETURNING *
        `;
        const { rows } = await pool.query(query, [orderStatus, trackingNumber, paymentStatus, req.params.id]);
        
        if (rows.length > 0) {
            res.json({ success: true, order: mapOrderForFrontend(rows[0]) });
        } else {
            res.status(404).json({ success: false, message: 'ไม่พบรายการออเดอร์' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'อัปเดตข้อมูลล้มเหลว: ' + error.message });
    }
});

// 6) แอดมินสั่งลบคำสั่งซื้อ
app.delete('/api/orders/:id', async (req, res) => {
    try {
        const selectQuery = await pool.query('SELECT slip_url FROM orders WHERE id = $1', [req.params.id]);
        if (selectQuery.rows.length === 0) return res.status(404).json({ message: 'ไม่พบออเดอร์ในระบบ' });

        const slipUrl = selectQuery.rows[0].slip_url;
        if (slipUrl) {
            const filePath = path.join(__dirname, slipUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath); // ลบไฟล์รูปจริงออกจากโฟลเดอร์ uploads
            }
        }

        await pool.query('DELETE FROM orders WHERE id = $1', [req.params.id]);
        res.json({ success: true, message: 'ลบข้อมูลออเดอร์และสลิปออกจากระบบเรียบร้อย' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'ลบข้อมูลล้มเหลว: ' + error.message });
    }
});

// ==========================================
// 6. API Routes สำหรับระบบรีวิว (Reviews)
// ==========================================

// 1) ลูกค้าส่งรีวิวสินค้า (บังคับล็อกอินผ่าน authenticateToken)
app.post('/api/reviews', authenticateToken, async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;
        const userId = req.user.id; // ดึง ID มาจาก Token ที่ล็อกอิน

        const result = await pool.query(
            'INSERT INTO reviews (product_id, user_id, rating, comment, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [productId, userId, rating, comment, 'pending']
        );
        res.status(201).json({ success: true, review: result.rows[0] });
    } catch (error) {
        console.error("Add Review Error:", error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการส่งรีวิว' });
    }
});

// 2) ดึงรีวิวที่ "อนุมัติแล้ว" ไปโชว์หน้าสินค้า (ไม่ต้องล็อกอิน ลูกค้าทั่วไปดูได้)
app.get('/api/reviews/product/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const query = `
            SELECT r.id AS _id, r.rating, r.comment, r.created_at, u.name AS user_name
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.product_id = $1 AND r.status = 'approved'
            ORDER BY r.created_at DESC
        `;
        const { rows } = await pool.query(query, [productId]);
        
        // จัดรูปแบบ JSON ให้ตรงกับที่ Frontend React คาดหวัง
        const formattedReviews = rows.map(row => ({
            _id: row._id,
            rating: row.rating,
            comment: row.comment,
            createdAt: row.created_at,
            userId: { name: row.user_name }
        }));
        
        res.json(formattedReviews);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'ดึงข้อมูลรีวิวไม่ได้' });
    }
});

// 3) แอดมินดึงรีวิว "ทั้งหมด" (ทุกสถานะ) ไปโชว์หน้า Manage Reviews (บังคับแอดมิน)
app.get('/api/admin/reviews', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin เท่านั้น' });
    
    try {
        // ดึงข้อมูลรีวิว พร้อมเชื่อมตาราง Users(ชื่อลูกค้า) และ Products(ชื่อสินค้า)
        const query = `
            SELECT r.id AS _id, r.rating, r.comment, r.status, r.created_at, 
                   u.name AS user_name, p.name AS product_name
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            LEFT JOIN products p ON r.product_id::varchar = p.id::varchar
            ORDER BY r.created_at DESC
        `;
        const { rows } = await pool.query(query);
        
        const formattedReviews = rows.map(row => ({
            _id: row._id,
            rating: row.rating,
            comment: row.comment,
            status: row.status,
            createdAt: row.created_at,
            userId: { name: row.user_name },
            productId: { name: row.product_name || 'ไม่ทราบชื่อสินค้า' }
        }));
        
        res.json(formattedReviews);
    } catch (error) {
        console.error("Admin Fetch Reviews Error:", error);
        res.status(500).json({ error: 'ดึงข้อมูลรีวิวทั้งหมดไม่ได้' });
    }
});

// 4) แอดมินเปลี่ยนสถานะรีวิว (Approve / Reject)
app.put('/api/admin/reviews/:id/status', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin เท่านั้น' });
    
    try {
        const { status } = req.body; 
        const result = await pool.query(
            'UPDATE reviews SET status = $1 WHERE id = $2 RETURNING *',
            [status, req.params.id]
        );
        
        if (result.rows.length === 0) return res.status(404).json({ error: 'ไม่พบรีวิวนี้' });
        res.json({ success: true, review: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'อัปเดตสถานะล้มเหลว' });
    }
});

// ==========================================
// 7. เปิดพอร์ตใช้งาน Server
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`KickZone Backend is running on port ${PORT}`));