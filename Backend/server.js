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
const bcrypt = require('bcrypt'); // 🌟 นำเข้า bcrypt สำหรับเข้ารหัสผ่าน
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

        // 2. ตาราง Reviews
        await pool.query(`
            CREATE TABLE IF NOT EXISTS reviews (
                id SERIAL PRIMARY KEY,
                product_id VARCHAR(255) NOT NULL,
                user_id INTEGER NOT NULL,
                rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
                comment TEXT NOT NULL,
                image VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await pool.query(`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS image VARCHAR(255);`);
        console.log("✅ NeonDB: ตรวจสอบและจัดการตาราง 'reviews' เรียบร้อย!");

        // 3. ตาราง Promotions
        await pool.query(`
            CREATE TABLE IF NOT EXISTS promotions (
                id SERIAL PRIMARY KEY,
                code VARCHAR(50) UNIQUE NOT NULL,
                description TEXT NOT NULL,
                discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
                discount_value NUMERIC(10, 2) NOT NULL,
                max_discount NUMERIC(10, 2),
                max_uses INTEGER,
                current_uses INTEGER DEFAULT 0,
                start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                end_date TIMESTAMP,
                is_flash_sale BOOLEAN DEFAULT false,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await pool.query(`ALTER TABLE promotions ADD COLUMN IF NOT EXISTS is_flash_sale BOOLEAN NOT NULL DEFAULT false;`);
        console.log("✅ NeonDB: ตรวจสอบและจัดการตาราง 'promotions' เรียบร้อย!");

        // 4. ตาราง Products
        const productsTableExists = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                  AND table_name = 'products'
            );
        `);

        if (!productsTableExists.rows[0].exists) {
            await pool.query(`
                CREATE TABLE products (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    brand VARCHAR(100),
                    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
                    image VARCHAR(255),
                    sku VARCHAR(100),
                    color VARCHAR(100),
                    release_date VARCHAR(100),
                    stock JSONB DEFAULT '{}'::jsonb,
                    discount_type VARCHAR(20) NOT NULL DEFAULT 'fixed',
                    discount_value NUMERIC(10, 2) NOT NULL DEFAULT 0
                );
            `);
            console.log("✅ NeonDB: สร้างตาราง 'products' ใหม่เรียบร้อย!");
        } else {
            await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS name VARCHAR(255) NOT NULL DEFAULT '';`);
            await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(100);`);
            await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) NOT NULL DEFAULT 0;`);
            await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS image VARCHAR(255);`);
            await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(100);`);
            await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS color VARCHAR(100);`);
            await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS release_date VARCHAR(100);`);
            await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS stock JSONB DEFAULT '{}'::jsonb;`);
            await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20) NOT NULL DEFAULT 'fixed';`);
            await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_value NUMERIC(10, 2) NOT NULL DEFAULT 0;`);
            await pool.query(`
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint WHERE conname = 'products_discount_type_check'
                    ) THEN
                        ALTER TABLE products ADD CONSTRAINT products_discount_type_check CHECK (discount_type IN ('percentage', 'fixed'));
                    END IF;
                END$$;
            `);
            console.log("✅ NeonDB: ตรวจสอบและปรับโครงสร้างตาราง 'products' เรียบร้อย!");
        }

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

        // 🌟 เข้ารหัสผ่านก่อนบันทึกลง Database (สุ่ม 10 รอบ)
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const result = await pool.query(
            'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
            [name, email, hashedPassword, 'customer'] // 🌟 บันทึก hashedPassword
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
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }
        
        const user = result.rows[0];
        let isMatch = false;

        // 🌟 ตรวจสอบรหัสผ่านโดยใช้ bcrypt.compare
        if (user.password === 'google-login') {
            // ถ้าเป็นบัญชี Google ไม่ให้ล็อกอินด้วยรหัสผ่านปกติ
            return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบด้วยปุ่ม Google' });
        } else {
            // นำรหัสผ่านที่กรอกมา เทียบกับรหัสผ่านที่เข้ารหัสไว้ในระบบ
            isMatch = await bcrypt.compare(password, user.password);
        }

        if (!isMatch) {
            return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }

        const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: 'Server Error' }); 
    }
});

// 🟢 API: เข้าสู่ระบบ / สมัครสมาชิก ด้วย Google
app.post('/api/google-login', async (req, res) => {
    const { access_token } = req.body;
    
    if (!access_token) {
        return res.status(400).json({ error: 'ไม่พบ Access Token จาก Google' });
    }

    try {
        // 1. นำ Token ไปถาม Google เพื่อขอข้อมูลผู้ใช้ (อีเมล, ชื่อ, รูปโปรไฟล์)
        const googleResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` }
        });
        const googleUser = await googleResponse.json();

        if (!googleUser.email) {
            return res.status(400).json({ error: 'ไม่สามารถดึงอีเมลจาก Google ได้' });
        }

        const { email, name } = googleUser;

        // 2. เช็คว่ามีอีเมลนี้ในฐานข้อมูลเราหรือยัง
        let result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        let user;

        if (result.rows.length === 0) {
            // 3. (กรณีไม่มีอีเมล) -> สมัครสมาชิกให้โดยอัตโนมัติ!
            // ตั้งรหัสผ่านหลอกๆ ไว้ เพราะผู้ใช้คนนี้ล็อกอินผ่าน Google ตลอด
            const insertResult = await pool.query(
                "INSERT INTO users (name, email, password, role) VALUES ($1, $2, 'google-login', 'customer') RETURNING *",
                [name, email]
            );
            user = insertResult.rows[0];
        } else {
            // 4. (กรณีมีอีเมลแล้ว) -> ดึงข้อมูลผู้ใช้มาใช้งาน
            user = result.rows[0];
        }

        // 5. สร้าง JWT Token ของระบบเราเอง (เหมือนการล็อกอินปกติ)
        const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '1d' });

        res.json({
            message: 'เข้าสู่ระบบด้วย Google สำเร็จ',
            token: token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });

    } catch (err) {
        console.error("Google Auth Error:", err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล Google' });
    }
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
    const { name, brand, price, image, sku, color, releaseDate, stock, discountType, discountValue } = req.body;

    try {
        const result = await pool.query(
            'INSERT INTO products (name, brand, price, image, sku, color, release_date, stock, discount_type, discount_value) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
            [name, brand, price, image, sku, color, releaseDate, JSON.stringify(stock), discountType || 'fixed', discountValue || 0]
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
    const { name, brand, price, image, sku, color, releaseDate, stock, discountType, discountValue } = req.body;

    try {
        const result = await pool.query(
            'UPDATE products SET name=$1, brand=$2, price=$3, image=$4, sku=$5, color=$6, release_date=$7, stock=$8, discount_type=$9, discount_value=$10 WHERE id=$11 RETURNING *',
            [name, brand, price, image, sku, color, releaseDate, JSON.stringify(stock), discountType || 'fixed', discountValue || 0, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'แก้ไขไม่สำเร็จ: ' + err.message });
    }
});

// อัปเดตส่วนลดสินค้าเฉพาะรายการ
app.patch('/api/products/:id/discount', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin เท่านั้น' });
    const { id } = req.params;
    const { discountType, discountValue } = req.body;

    if (!['percentage', 'fixed'].includes(discountType)) {
        return res.status(400).json({ error: 'discountType ต้องเป็น percentage หรือ fixed' });
    }

    try {
        const result = await pool.query(
            'UPDATE products SET discount_type=$1, discount_value=$2 WHERE id=$3 RETURNING *',
            [discountType, Number(discountValue) || 0, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'ไม่พบสินค้าในระบบ' });
        res.json({ success: true, product: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'อัปเดตส่วนลดสินค้าไม่สำเร็จ: ' + err.message });
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

// 1) บันทึกสั่งซื้อใหม่ และตัดสต๊อกสินค้า
app.post('/api/orders', async (req, res) => {
    // 🌟 ใช้ Transaction เพื่อให้แน่ใจว่าถ้าตัดสต๊อกพลาด ออเดอร์จะไม่ถูกสร้าง (ป้องกันข้อมูลไม่ตรงกัน)
    const client = await pool.connect(); 
    try {
        await client.query('BEGIN'); // เริ่ม Transaction

        // รับค่า items ที่เราเพิ่งแก้ให้หน้าบ้านส่งมา
        const { customerName, customerEmail, shoeModel, size, totalAmount, paymentMethod, items } = req.body;
        const newId = 'KZ' + Math.floor(100000 + Math.random() * 900000).toString();
        
        // --- ส่วนที่ 1: บันทึกข้อมูลออเดอร์ลงตาราง orders ---
        const orderQuery = `
            INSERT INTO orders (id, customer_name, customer_email, shoe_model, size, total_amount, payment_method) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
        `;
        const orderValues = [newId, customerName, customerEmail, shoeModel, size, Number(totalAmount), paymentMethod || 'PromptPay'];
        const { rows } = await client.query(orderQuery, orderValues);

        // --- ส่วนที่ 2: วนลูปตัดสต๊อกสินค้าในตาราง products ---
        if (items && items.length > 0) {
            for (const item of items) {
                // ดึงข้อมูลสต๊อกปัจจุบันของสินค้านั้น
                const productRes = await client.query('SELECT stock FROM products WHERE id = $1', [item.productId]);
                
                if (productRes.rows.length > 0) {
                    let currentStock = productRes.rows[0].stock;
                    
                    // แปลงกลับเป็น Object ถ้าฐานข้อมูลเก็บเป็น String JSON
                    if (typeof currentStock === 'string') {
                        currentStock = JSON.parse(currentStock);
                    }

                    // ค้นหาไซส์ที่ตรงกัน (หน้าบ้านอาจส่งมา '43' แต่ใน DB อาจเก็บ 'EU 43')
                    const selectedSize = item.size.toString().trim();
                    const sizeKey = Object.keys(currentStock).find(key => 
                        key === selectedSize || 
                        key === `EU ${selectedSize}` || 
                        key.includes(selectedSize)
                    );

                    // ถ้าเจอไซส์นั้น และมีของเหลืออยู่
                    if (sizeKey && currentStock[sizeKey] !== undefined) {
                        const qtyToDeduct = item.quantity || 1;
                        
                        // ป้องกันไม่ให้สต๊อกติดลบ (อย่างน้อยเป็น 0)
                        currentStock[sizeKey] = Math.max(0, currentStock[sizeKey] - qtyToDeduct);
                        
                        // อัปเดตสต๊อกกลับเข้าไปใน Database
                        await client.query(
                            'UPDATE products SET stock = $1 WHERE id = $2', 
                            [JSON.stringify(currentStock), item.productId]
                        );
                    }
                }
            }
        }

        await client.query('COMMIT'); // สิ้นสุดและยืนยันการบันทึกข้อมูล (ออเดอร์ + ตัดสต๊อก)
        res.status(201).json({ success: true, order: mapOrderForFrontend(rows[0]) });

    } catch (error) {
        await client.query('ROLLBACK'); // ❌ ถ้าระหว่างทางมี Error ให้ยกเลิกการทำงานทั้งหมด 
        console.error("Order Insertion Error:", error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อและตัดสต๊อก: ' + error.message });
    } finally {
        client.release(); // คืน Connection ให้ Pool
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
app.post('/api/reviews', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;
        const userId = req.user.id; // ดึง ID มาจาก Token ที่ล็อกอิน
        const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

        const result = await pool.query(
            'INSERT INTO reviews (product_id, user_id, rating, comment, image) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [productId, userId, rating, comment, imagePath]
        );
        res.status(201).json({ success: true, review: result.rows[0] });
    } catch (error) {
        console.error("Add Review Error:", error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการส่งรีวิว' });
    }
});

// 2) ดึงรีวิวสินค้า ไปโชว์หน้าสินค้า (ไม่ต้องล็อกอิน ลูกค้าทั่วไปดูได้)
app.get('/api/reviews/product/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const query = `
            SELECT r.id, r.rating, r.comment, r.image, r.created_at, u.name AS user_name
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.product_id = $1
            ORDER BY r.created_at DESC
        `;
        const { rows } = await pool.query(query, [productId]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'ดึงข้อมูลรีวิวไม่ได้' });
    }
});

// 3) แอดมินดึงรีวิว "ทั้งหมด" ไปโชว์หน้า Manage Reviews (บังคับแอดมิน)
app.get('/api/admin/reviews', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin เท่านั้น' });
    
    try {
        // ดึงข้อมูลรีวิว พร้อมเชื่อมตาราง Users(ชื่อลูกค้า) และ Products(ชื่อสินค้า)
        const query = `
            SELECT r.id, r.rating, r.comment, r.image, r.created_at, 
                   u.name AS user_name, p.name AS product_name
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            LEFT JOIN products p ON r.product_id::varchar = p.id::varchar
            ORDER BY r.created_at DESC
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error("Admin Fetch Reviews Error:", error);
        res.status(500).json({ error: 'ดึงข้อมูลรีวิวทั้งหมดไม่ได้' });
    }
});

// 4) แอดมินลบรีวิว
app.delete('/api/admin/reviews/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin เท่านั้น' });
    
    try {
        const result = await pool.query(
            'DELETE FROM reviews WHERE id = $1 RETURNING id',
            [req.params.id]
        );
        
        if (result.rows.length === 0) return res.status(404).json({ error: 'ไม่พบรีวิวนี้' });
        res.json({ success: true, message: 'ลบรีวิวสำเร็จ' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'ลบรีวิวล้มเหลว' });
    }
});

// ==========================================
// 7. API Routes สำหรับระบบโปรโมชั่น (Promotions)
// ==========================================

// 1) ผู้ใช้ดูโปรโมชั่นที่ใช้งานอยู่ (ไม่ต้องล็อกอิน)
app.get('/api/promotions', async (req, res) => {
    try {
        const query = `
            SELECT id, code, description, discount_type, discount_value, 
                   max_uses, current_uses, start_date, end_date, is_flash_sale, is_active
            FROM promotions
            WHERE is_active = true 
            AND NOW() >= start_date 
            AND (end_date IS NULL OR NOW() <= end_date)
            ORDER BY created_at DESC
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error("Fetch Promotions Error:", error);
        res.status(500).json({ error: 'ดึงข้อมูลโปรโมชั่นไม่ได้' });
    }
});

// 2) ตรวจสอบและยืนยันโปรโมชั่น
app.post('/api/promotions/validate', async (req, res) => {
    try {
        const { code, cartTotal } = req.body;
        
        if (!code) {
            return res.status(400).json({ error: 'กรุณากรอกรหัสโปรโมชั่น' });
        }

        const result = await pool.query(
            `SELECT * FROM promotions 
             WHERE code = $1 AND is_active = true 
             AND NOW() >= start_date 
             AND (end_date IS NULL OR NOW() <= end_date)`,
            [code]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'โปรโมชั่นไม่ถูกต้องหรือหมดอายุแล้ว' });
        }

        const promo = result.rows[0];

        // ตรวจสอบว่าใช้งบประมาณหมดแล้วหรือไม่
        if (promo.max_uses && promo.current_uses >= promo.max_uses) {
            return res.status(400).json({ error: 'โปรโมชั่นนี้ใช้งบประมาณหมดแล้ว' });
        }

        let discountAmount = 0;
        if (promo.discount_type === 'percentage') {
            discountAmount = (cartTotal * promo.discount_value) / 100;
        } else if (promo.discount_type === 'fixed') {
            discountAmount = promo.discount_value;
        }

        // ถ้ามี max_discount กำหนดไว้ ให้จำกัดส่วนลดสูงสุด
        if (promo.max_discount && discountAmount > promo.max_discount) {
            discountAmount = promo.max_discount;
        }

        res.json({
            success: true,
            message: 'โปรโมชั่นถูกต้อง',
            promotion: {
                id: promo.id,
                code: promo.code,
                description: promo.description,
                discountType: promo.discount_type,
                discountValue: promo.discount_value,
                discountAmount: discountAmount,
                maxDiscount: promo.max_discount || null,
                isFlashSale: promo.is_flash_sale
            }
        });
    } catch (error) {
        console.error("Validate Promotion Error:", error);
        res.status(500).json({ error: 'ตรวจสอบโปรโมชั่นล้มเหลว' });
    }
});

// 3) แอดมินดูโปรโมชั่นทั้งหมด
app.get('/api/admin/promotions', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin เท่านั้น' });
    
    try {
        const query = `
            SELECT id, code, description, discount_type, discount_value, max_discount,
                   max_uses, current_uses, start_date, end_date, is_flash_sale, is_active, created_at, updated_at
            FROM promotions
            ORDER BY created_at DESC
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error("Admin Fetch Promotions Error:", error);
        res.status(500).json({ error: 'ดึงข้อมูลโปรโมชั่นไม่ได้' });
    }
});

// 4) แอดมินสร้างโปรโมชั่นใหม่
app.post('/api/admin/promotions', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin เท่านั้น' });
    
    try {
        const {
            code,
            description,
            discountType,
            discountValue,
            maxDiscount,
            maxUses,
            startDate,
            endDate,
            isFlashSale,
            isActive,
            is_active
        } = req.body;

        if (!code || !description || !discountType || !discountValue) {
            return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }

        if (!['percentage', 'fixed'].includes(discountType)) {
            return res.status(400).json({ error: 'ประเภทส่วนลดไม่ถูกต้อง' });
        }

        const active = typeof isActive === 'boolean' ? isActive : (typeof is_active === 'boolean' ? is_active : true);
        const maxDiscountValue = maxDiscount ? Number(maxDiscount) : null;
        const maxUsesValue = maxUses ? Number(maxUses) : null;
        const startDateValue = startDate ? startDate : new Date();
        const endDateValue = endDate ? endDate : null;
        const flashSaleValue = typeof isFlashSale === 'boolean' ? isFlashSale : false;

        const result = await pool.query(
            `INSERT INTO promotions (code, description, discount_type, discount_value, max_discount, max_uses, start_date, end_date, is_flash_sale, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING *`,
            [code, description, discountType, discountValue, maxDiscountValue, maxUsesValue, startDateValue, endDateValue, flashSaleValue, active]
        );

        res.status(201).json({ 
            success: true, 
            message: 'สร้างโปรโมชั่นสำเร็จ',
            promotion: result.rows[0] 
        });
    } catch (error) {
        if (error.message.includes('duplicate')) {
            return res.status(400).json({ error: 'รหัสโปรโมชั่นนี้ถูกใช้งานแล้ว' });
        }
        console.error("Create Promotion Error:", error);
        res.status(500).json({ error: 'สร้างโปรโมชั่นล้มเหลว' });
    }
});

// 5) แอดมินแก้ไขโปรโมชั่น
app.put('/api/admin/promotions/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin เท่านั้น' });
    
    try {
        const {
            code,
            description,
            discountType,
            discountValue,
            maxDiscount,
            maxUses,
            startDate,
            endDate,
            isFlashSale,
            isActive,
            is_active
        } = req.body;

        const active = typeof isActive === 'boolean' ? isActive : (typeof is_active === 'boolean' ? is_active : true);
        const maxDiscountValue = maxDiscount ? Number(maxDiscount) : null;
        const maxUsesValue = maxUses ? Number(maxUses) : null;
        const startDateValue = startDate ? startDate : null;
        const endDateValue = endDate ? endDate : null;
        const flashSaleValue = typeof isFlashSale === 'boolean' ? isFlashSale : false;

        const result = await pool.query(
            `UPDATE promotions 
             SET code=$1, description=$2, discount_type=$3, discount_value=$4, max_discount=$5, max_uses=$6, start_date=$7, end_date=$8, is_flash_sale=$9, is_active=$10, updated_at=CURRENT_TIMESTAMP
             WHERE id=$11 RETURNING *`,
            [code, description, discountType, discountValue, maxDiscountValue, maxUsesValue, startDateValue, endDateValue, flashSaleValue, active, req.params.id]
        );
        
        if (result.rows.length === 0) return res.status(404).json({ error: 'ไม่พบโปรโมชั่นนี้' });
        res.json({ success: true, promotion: result.rows[0] });
    } catch (error) {
        console.error("Update Promotion Error:", error);
        res.status(500).json({ error: 'แก้ไขโปรโมชั่นล้มเหลว' });
    }
});

// 6) แอดมินลบโปรโมชั่น
app.delete('/api/admin/promotions/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin เท่านั้น' });
    
    try {
        const result = await pool.query(
            'DELETE FROM promotions WHERE id = $1 RETURNING id',
            [req.params.id]
        );
        
        if (result.rows.length === 0) return res.status(404).json({ error: 'ไม่พบโปรโมชั่นนี้' });
        res.json({ success: true, message: 'ลบโปรโมชั่นสำเร็จ' });
    } catch (error) {
        console.error("Delete Promotion Error:", error);
        res.status(500).json({ error: 'ลบโปรโมชั่นล้มเหลว' });
    }
});

// ==========================================
// 8. API Routes สำหรับระบบจัดการผู้ใช้งาน (Manage Users)
// ==========================================

// 1) แอดมินดึงข้อมูลผู้ใช้งานทั้งหมด
app.get('/api/users', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin เท่านั้น' });
    
    try {
        // ดึงเฉพาะข้อมูลทั่วไป ไม่ดึงรหัสผ่าน (password) ออกมาเพื่อความปลอดภัย
        const result = await pool.query('SELECT id, name, email, role FROM users ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error("Fetch Users Error:", err);
        res.status(500).json({ error: 'ดึงข้อมูลผู้ใช้งานล้มเหลว' });
    }
});

// 2) แอดมินแก้ไขสิทธิ์ (Role) ของผู้ใช้งาน
app.patch('/api/users/:id/role', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin เท่านั้น' });
    
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'customer'].includes(role)) {
        return res.status(400).json({ error: 'ข้อมูลประเภทสิทธิ์ไม่ถูกต้อง' });
    }

    // ระบบป้องกัน: ป้องกันไม่ให้แอดมินเปลี่ยนสิทธิ์ของตัวเอง 
    // (ป้องกันกรณีเผลอเปลี่ยนตัวเองเป็น customer แล้วจะไม่มีใครเป็นแอดมินเลย)
    if (parseInt(id) === req.user.id) {
        return res.status(400).json({ error: 'ไม่อนุญาตให้ลดสิทธิ์บัญชีของตัวคุณเอง' });
    }

    try {
        const result = await pool.query(
            'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, role',
            [role, id]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'ไม่พบผู้ใช้งานนี้ในระบบ' });
        
        res.json({ success: true, message: 'อัปเดตสิทธิ์สำเร็จ', user: result.rows[0] });
    } catch (err) {
        console.error("Update Role Error:", err);
        res.status(500).json({ error: 'อัปเดตสิทธิ์ผู้ใช้ล้มเหลว' });
    }
});

// 3) แอดมินลบผู้ใช้งานออกจากระบบ
app.delete('/api/users/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin เท่านั้น' });
    
    const { id } = req.params;

    // ระบบป้องกัน: ป้องกันไม่ให้แอดมินลบบัญชีของตัวเอง
    if (parseInt(id) === req.user.id) {
        return res.status(400).json({ error: 'ไม่อนุญาตให้ลบบัญชีที่กำลังใช้งานอยู่' });
    }

    try {
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
        
        if (result.rows.length === 0) return res.status(404).json({ error: 'ไม่พบผู้ใช้งานนี้ในระบบ' });
        
        res.json({ success: true, message: 'ลบผู้ใช้งานออกจากระบบเรียบร้อยแล้ว' });
    } catch (err) {
        console.error("Delete User Error:", err);
        res.status(500).json({ error: 'ลบผู้ใช้งานล้มเหลว อาจมีข้อมูลอื่นผูกพันอยู่' });
    }
});

// ==========================================
// 9. Start Server
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});