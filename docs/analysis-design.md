# เอกสารวิเคราะห์และออกแบบระบบ (Analysis & Design)
## โครงงาน: KickZone (คิ๊กโซน) - ระบบเว็บไซต์ร้านค้าออนไลน์สำหรับจัดจำหน่ายรองเท้า

---

## 📋 สารบัญ

- [การวิเคราะห์ความต้องการ](#การวิเคราะห์ความต้องการ)
- [แผนภาพยูสเคส](#แผนภาพยูสเคส)
- [โครงสร้างคลาส](#โครงสร้างคลาส)
- [แผนภาพลำดับการทำงาน](#แผนภาพลำดับการทำงาน)

---

## 1. การวิเคราะห์ความต้องการ (Requirements Analysis)

### 1.1 ความต้องการของผู้ใช้งาน (User Requirements)

ระบบมีผู้ใช้งานหลัก 2 กลุ่ม คือ ลูกค้า (Customer) และ ผู้ดูแลระบบ (Admin)

**ลูกค้า (Customer)**
* สมัครสมาชิก และเข้าสู่ระบบ (รองรับการเข้าสู่ระบบด้วยบัญชี Google)
* ค้นหา กรองช่วงราคา และเลือกดูสินค้ารองเท้าตามแบรนด์
* ดูรายละเอียดสินค้า โทนสี และตรวจสอบสต็อกแบบแยกตามไซส์ (EU Size)
* เพิ่มสินค้าลงตะกร้า (Shopping Cart) และบันทึกสินค้าที่ชอบ (Wishlist)
* ใช้งานโค้ดส่วนลด (Promo Code) และเข้าร่วมแคมเปญ Flash Sale
* ดำเนินการสั่งซื้อสินค้า (Checkout) พร้อมแนบหลักฐานการชำระเงิน (Upload Slip)
* ให้คะแนน (Rating) เขียนรีวิว และแนบรูปภาพสินค้าหลังการซื้อ
* ดูประวัติการสั่งซื้อ และติดตามสถานะพัสดุของตนเอง

**ผู้ดูแลระบบ (Admin)**
* ดูภาพรวมของระบบผ่าน Dashboard (สรุปยอดขาย, จำนวนคำสั่งซื้อ, จำนวนสินค้า)
* จัดการข้อมูลสินค้า (เพิ่ม/แก้ไข/ลบ ข้อมูลทั่วไป รูปภาพ และสต็อกสินค้าแยกตามไซส์)
* จัดการคำสั่งซื้อ (ตรวจสอบสลิปโอนเงิน, อัปเดตสถานะการจัดส่ง, และออกเลข Tracking อัตโนมัติ)
* จัดการโปรโมชั่น (สร้าง/แก้ไข/ลบ โค้ดส่วนลด, กำหนดสิทธิ์การใช้, และเปิดโหมด Flash Sale)
* จัดการรีวิว (ตรวจสอบข้อความ/รูปภาพ และลบรีวิวที่ไม่เหมาะสม)

### 1.2 ขอบเขตของระบบ (System Scope)

* 1.ระบบจัดการสมาชิกและการยืนยันตัวตน: ครอบคลุมการสมัครสมาชิก เข้าสู่ระบบ และการเชื่อมต่อผ่าน Google OAuth
* 2.ระบบจัดการข้อมูลสินค้าและคลังสินค้า: จัดการข้อมูลรองเท้าและระบบตัดสต็อกแบบเจาะจงตามไซส์ (EU Size)
* 3.ระบบค้นหาและแสดงผลสินค้า: ครอบคลุมการกรองสินค้าตามแบรนด์และราคา พร้อมแสดงรายละเอียดสินค้าที่ครบถ้วน
* 4.ระบบตะกร้าสินค้าและรายการที่ชอบ: การคำนวณราคาสินค้าในตะกร้า (Shopping Cart) และระบบ Wishlist
* 5.ระบบสั่งซื้อและโปรโมชั่น: การสร้างคำสั่งซื้อ การคำนวณส่วนลดจาก Promo Code และระบบ Flash Sale
* 6.ระบบการชำระเงิน: รองรับการยืนยันการสั่งซื้อผ่านการอัปโหลดหลักฐานการโอนเงิน (สลิปโอนเงิน)
* 7.ระบบติดตามคำสั่งซื้อ: การแสดงประวัติการสั่งซื้อและสถานะพัสดุสำหรับลูกค้า
* 8.ระบบรีวิวสินค้า: รองรับการให้คะแนนดาว เขียนความคิดเห็น และอัปโหลดรูปภาพรีวิวจากผู้ใช้งานจริง
* 9.ระบบจัดการหลังบ้าน (Admin Panel): แผงควบคุมสำหรับผู้ดูแลระบบในการจัดการคำสั่งซื้อ สินค้า โปรโมชั่น รีวิว และแสดงรายงานสรุปผล (Dashboard)

### 2. แผนภาพยูสเคส (Use Case Diagram)
![Use Case Diagram](UseCase.png)

```mermaid
flowchart LR
    %% Actors Definition
    subgraph Actors ["👥 ผู้ใช้งานระบบ (Actors)"]
        Customer["👤 ลูกค้า (Customer)"]
        Admin["🔧 ผู้ดูแลระบบ (Admin)"]
        GoogleAuth["🌐 Google OAuth"]
    end

    %% Boundary System
    subgraph KickZoneSystem ["👟 KickZone Shoe System"]

        subgraph ModAuth ["1. ระบบยืนยันตัวตน (Authentication)"]
            UC1(["UC-01: สมัครสมาชิก (Register)"])
            UC2(["UC-02: เข้าสู่ระบบ (Login)"])
            UC3(["UC-03: เข้าสู่ระบบด้วย Google (Google Login)"])
        end

        subgraph ModProduct ["2. ระบบสินค้าและค้นหา (Product & Search)"]
            UC4(["UC-04: ค้นหาและกรองรองเท้าตามแบรนด์/ราคา"])
            UC5(["UC-05: ดูรายละเอียดสินค้า & สต็อกไซส์ (EU Size)"])
            UC6(["UC-06: จัดการตะกร้าสินค้า (Cart)"])
            UC7(["UC-07: บันทึกสินค้าที่ชอบ (Wishlist)"])
        end

        subgraph ModOrder ["3. ระบบสั่งซื้อและชำระเงิน (Orders & Payment)"]
            UC8(["UC-08: สั่งซื้อสินค้า & ใช้โค้ดส่วนลด (Checkout & Promo)"])
            UC9(["UC-09: อัปโหลดสลิปโอนเงิน (Upload Slip)"])
            UC10(["UC-10: ติดตามสถานะคำสั่งซื้อ & พัสดุ (Order Tracking)"])
        end

        subgraph ModReview ["4. ระบบรีวิวสินค้า (Product Reviews)"]
            UC11(["UC-11: เขียนรีวิวสินค้าและให้คะแนนดาว"])
        end

        subgraph ModAdmin ["5. ระบบจัดการหลังบ้าน (Admin Management)"]
            UC12(["UC-12: ดู Dashboard และสรุปยอดขาย"])
            UC13(["UC-13: จัดการสินค้าและสต็อกไซส์ (Manage Products)"])
            UC14(["UC-14: จัดการคำสั่งซื้อและตรวจสลิป (Manage Orders & Slips)"])
            UC15(["UC-15: อัปเดตสถานะจัดส่ง & ออกเลข Tracking"])
            UC16(["UC-16: จัดการโปรโมชั่น & Flash Sale"])
            UC17(["UC-17: ตรวจสอบและจัดการรีวิว (Manage Reviews)"])
        end

    end
%% Customer Connections
    Customer --> UC1
    Customer --> UC2
    Customer --> UC3
    Customer --> UC4
    Customer --> UC5
    Customer --> UC6
    Customer --> UC7
    Customer --> UC8
    Customer --> UC9
    Customer --> UC10
    Customer --> UC11
%% External System Relationship
    UC3 -.-> GoogleAuth

    %% Admin Connections
    Admin --> UC12
    Admin --> UC13
    Admin --> UC14
    Admin --> UC15
    Admin --> UC16
    Admin --> UC17
```

---

### 3. โครงสร้างคลาส (Class Diagram)
ส่วนนี้แสดงโครงสร้างข้อมูล ความสัมพันธ์ระหว่าง Class (Relationships) และ Attributes/Methods ที่ใช้ในระบบจัดการร้านรองเท้ากีฬา
![Class Diagram](ClassDiagram.png)

```mermaid
classDiagram
    direction TB

    %% ==========================================
    %% 1. User & Identity Layer
    %% ==========================================
    class User {
        - userId: int
        - name: string
        - email: string
        - password: string
        - createdAt: datetime
        + register(): void
        + login(email, password): bool
        + logout(): void
        + updateProfile(): void
    }

    class Customer {
        - customerId: int
        - userId: int
        + viewOrderHistory(): List~Order~
    }

    class Admin {
        - adminId: int
        - userId: int
        - role: string
        + manageProduct(): void
        + manageOrder(): void
        + managePromotion(): void
        + manageReview(): void
    }

    class Address {
        - addressId: int
        - userId: int
        - recipientName: string
        - phone: string
        - addressLine: string
        - subdistrict: string
        - district: string
        - province: string
        - postalCode: string
        - isDefault: bool
        + addAddress(): void
        + updateAddress(): void
        + deleteAddress(): void
    }

    %% User Relationships
    User <|-- Customer
    User <|-- Admin
    User "1" -- "1..*" Address : มีที่อยู่

    %% ==========================================
    %% 2. Product & Catalog Layer
    %% ==========================================
    class Category {
        - categoryId: int
        - categoryName: string
        - description: string
        + getProducts(): List~Product~
    }

    class Product {
        - productId: int
        - categoryId: int
        - productName: string
        - brand: string
        - sku: string
        - color: string
        - price: decimal
        - imageUrl: string
        - releaseDate: string
        - status: string
        - createdAt: datetime
        + getDetail(): Product
        + updateStock(size, qty): void
    }

    class Inventory {
        - inventoryId: int
        - productId: int
        - sizeEU: string
        - stockQty: int
        - reservedQty: int
        + increaseStock(qty): void
        + decreaseStock(qty): void
        + getAvailableStock(): int
    }

    %% Product Relationships
    Category "1" -- "0..*" Product : หมวดหมู่แบรนด์
    Product "1" -- "1..*" Inventory : จัดการสต็อกไซส์

    %% ==========================================
    %% 3. Cart & Shopping Layer
    %% ==========================================
    class Cart {
        - cartId: int
        - userId: int
        - createdAt: datetime
        + addItem(productId, size, qty): void
        + updateItem(productId, qty): void
        + removeItem(productId): void
        + clearCart(): void
        + getTotal(): decimal
    }

    class CartItem {
        - cartItemId: int
        - cartId: int
        - productId: int
        - selectedSize: string
        - quantity: int
        - price: decimal
        + getSubtotal(): decimal
    }

    %% Cart Relationships
    Customer "1" -- "0..1" Cart : เจ้าของตะกร้า
    Cart "1" *-- "1..*" CartItem : ประกอบด้วย
    CartItem "*" -- "1" Product : อ้างอิงสินค้า

    %% ==========================================
    %% 4. Order & Transaction Layer
    %% ==========================================
    class Order {
        - orderId: int
        - userId: int
        - orderDate: datetime
        - status: string
        - totalAmount: decimal
        - shippingAddressId: int
        - paymentStatus: string
        + calculateTotal(): decimal
        + changeStatus(status): void
        + cancelOrder(): void
    }

    class OrderItem {
        - orderItemId: int
        - orderId: int
        - productId: int
        - selectedSize: string
        - productName: string
        - price: decimal
        - quantity: int
        - subtotal: decimal
        + getSubtotal(): decimal
    }

    %% Order Relationships
    Customer "1" -- "0..*" Order : สั่งซื้อสินค้า
    Address "1" -- "0..*" Order : สั่งซื้อส่งที่อยู่
    Order "1" *-- "1..*" OrderItem : ประกอบด้วย
    OrderItem "*" -- "1" Product : อ้างอิงสินค้า

    %% ==========================================
    %% 5. Fulfillment, Promotion & Feedback
    %% ==========================================
    class Payment {
        - paymentId: int
        - orderId: int
        - paymentMethod: string
        - amount: decimal
        - slipImage: string
        - paidAt: datetime
        - status: string
        + processPayment(): bool
        + verifySlip(): bool
    }

    class Shipment {
        - shipmentId: int
        - orderId: int
        - shippingMethod: string
        - trackingNumber: string
        - shippedDate: datetime
        - status: string
        + updateStatus(status): void
    }

    class Promotion {
        - promotionId: int
        - code: string
        - discountType: string
        - discountValue: decimal
        - minOrderAmount: decimal
        - startDate: datetime
        - endDate: datetime
        - status: string
        + isValid(): bool
    }

    class Review {
        - reviewId: int
        - productId: int
        - userId: int
        - rating: int
        - comment: string
        - createdAt: datetime
        + editReview(): void
    }

    %% Service & Review Relationships
    Order "1" -- "1" Payment : ชำระเงิน
    Order "1" -- "0..1" Shipment : จัดส่ง
    Promotion ..> Order : ใช้ส่วนลด
    Customer "1" -- "0..*" Review : เขียนรีวิว
    Product "1" -- "0..*" Review : ได้รับรีวิว
```

---

### 4. แผนภาพลำดับการทำงาน (Sequence Diagram)
ส่วนนี้แสดงลำดับขั้นตอนการสื่อสารและทำงานร่วมกันของระบบต่างๆ ตั้งแต่ผู้ใช้เรียกดูสินค้าจนถึงขั้นตอนการชำระเงินและส่งข้อมูลไปยังคลังสินค้า
![Sequence Diagram](SequenceDiagram.png)

```mermaid
sequenceDiagram
    autonumber
    actor C as 🧍 ลูกค้า
    participant F as 🖥️ หน้าเว็บไซต์<br/>(React Frontend)
    participant PS as 📦 บริการสินค้า<br/>(Product API)
    participant CS as 🛒 ตะกร้าสินค้า<br/>(Cart State)
    participant OS as 📋 บริการสั่งซื้อ<br/>(Order API)
    participant DB as 🗄️ ฐานข้อมูล<br/>(Database)

    %% ==================================
    %% 1. ค้นหาสินค้า
    %% ==================================
    Note over C, DB: ❶ ค้นหาสินค้า (Search Product)
    C->>F: กรอกคำค้นหา / เลือกรุ่นรองเท้า
    activate F
    F->>PS: ส่งคำค้นหา (GET /api/products)
    activate PS
    PS->>DB: ดึงข้อมูลสินค้า
    activate DB
    DB-->>PS: ส่งข้อมูลสินค้า
    deactivate DB
    PS-->>F: คืนค่ารายการสินค้า
    deactivate PS
    F-->>C: แสดงผลลัพธ์สินค้ารองเท้า
    deactivate F

    %% ==================================
    %% 2. เลือกสินค้า
    %% ==================================
    Note over C, DB: ❷ เลือกสินค้า (Select Product)
    C->>F: เลือกสินค้าที่ต้องการดู
    activate F
    F->>PS: ขอรายละเอียดสินค้า (GET /api/products/{id})
    activate PS
    PS->>DB: ดึงรายละเอียด & สต็อกแต่ละไซส์
    activate DB
    DB-->>PS: ส่งรายละเอียดสินค้า
    deactivate DB
    PS-->>F: คืนค่ารายละเอียด
    deactivate PS
    F-->>C: แสดงรายละเอียดและไซส์ (EU)
    deactivate F

    %% ==================================
    %% 3. เพิ่มสินค้าลงตะกร้า
    %% ==================================
    Note over C, DB: ❸ เพิ่มสินค้าลงตะกร้า (Add to Cart)
    C->>F: เลือกไซส์ + กดปุ่ม "เพิ่มลงตะกร้า"
    activate F
    F->>CS: เพิ่มสินค้า (productId, size, qty)
    activate CS
    CS-->>F: ยืนยันการเพิ่มสินค้า
    deactivate CS
    F-->>C: อัปเดตและแสดงตะกร้าสินค้า
    deactivate F

    %% ==================================
    %% 4. ชำระเงิน / สั่งซื้อ
    %% ==================================
    Note over C, DB: ❹ สั่งซื้อและชำระเงิน (Checkout & Payment)
    C->>F: กรอกที่อยู่จัดส่ง + กด "ชำระเงิน/สั่งซื้อ"
    activate F
    F->>OS: สร้างคำสั่งซื้อ (POST /api/orders)
    activate OS
    OS->>DB: บันทึกออเดอร์ & ตัดสต็อกรองเท้า
    activate DB
    DB-->>OS: ยืนยันการบันทึก
    deactivate DB
    OS-->>F: ยืนยันคำสั่งซื้อสำเร็จ (Response 201)
    deactivate OS
    F-->>C: แสดงหน้าสำเร็จ (พร้อมหมายเลขคำสั่งซื้อ)
    deactivate F
```

---

🗄️ โครงสร้างข้อมูล (JSON Schema)
ระบบ KickZone Shoe ใช้โครงสร้างข้อมูล JSON สำหรับแลกเปลี่ยนข้อมูลระหว่าง Frontend (React) และ Backend (Express RESTful API) รวมถึงการบันทึกข้อมูลในฐานข้อมูล PostgreSQL (JSONB):

เอกสารฉบับเต็มของ JSON Schema สามารถดูได้ที่ [docs/json-schema.json](./docs/json-schema.json)

📌 สรุป Schema สำหรับ Entities หลัก:
#### 1. Product Schema (สินค้าและสต็อกตามไซส์)
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Product",
  "type": "object",
  "properties": {
    "id": { "type": "integer" },
    "name": { "type": "string" },
    "brand": { "type": "string" },
    "price": { "type": "number", "minimum": 0 },
    "image": { "type": "string" },
    "sku": { "type": "string" },
    "color": { "type": "string" },
    "releaseDate": { "type": "string" },
    "stock": {
      "type": "object",
      "additionalProperties": { "type": "integer", "minimum": 0 },
      "description": "สต็อกแยกตาม EU Size เช่น {'38': 10, '39': 5, '40': 0}"
    },
    "discountType": { "type": "string", "enum": ["fixed", "percentage"] },
    "discountValue": { "type": "number", "default": 0 },
    "promotionTag": { "type": "string" }
  },
  "required": ["name", "price", "stock"]
}
#### 2. Order Schema (คำสั่งซื้อและสลิปการโอน)
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Order",
  "type": "object",
  "properties": {
    "id": { "type": "string", "description": "รหัสคำสั่งซื้อ เช่น ORD-1721689200000-123" },
    "customerName": { "type": "string" },
    "customerEmail": { "type": "string", "format": "email" },
    "shoeModel": { "type": "string" },
    "size": { "type": "string" },
    "totalAmount": { "type": "number", "minimum": 0 },
    "paymentMethod": { "type": "string", "default": "PromptPay" },
    "paymentStatus": { "type": "string", "enum": ["Pending Upload", "Paid", "Rejected", "Refunded"] },
    "orderStatus": { "type": "string", "enum": ["Processing", "Shipping", "Completed", "Cancelled"] },
    "trackingNumber": { "type": "string", "default": "N/A" },
    "slipUrl": { "type": ["string", "null"] },
    "createdAt": { "type": "string", "format": "date-time" }
  },
  "required": ["id", "customerName", "customerEmail", "shoeModel", "size", "totalAmount"]
}


#### 3. Promotion Schema (โปรโมชั่นและ Flash Sale)
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Promotion",
  "type": "object",
  "properties": {
    "id": { "type": "integer" },
    "code": { "type": "string" },
    "description": { "type": "string" },
    "discountType": { "type": "string", "enum": ["percentage", "fixed"] },
    "discountValue": { "type": "number" },
    "maxDiscount": { "type": ["number", "null"] },
    "maxUses": { "type": ["integer", "null"] },
    "currentUses": { "type": "integer", "default": 0 },
    "isFlashSale": { "type": "boolean", "default": false },
    "isActive": { "type": "boolean", "default": true }
  },
  "required": ["code", "discountType", "discountValue"]
}

---
**ดู:** [System Architecture →](architecture.md)
