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
* สมัครสมาชิก / เข้าสู่ระบบ
* ค้นหาและเลือกซื้อสินค้ารองเท้า
* เพิ่มสินค้าลงตะกร้า (Cart)
* สั่งซื้อสินค้า (Checkout)
* ดูประวัติการสั่งซื้อ

**ผู้ดูแลระบบ (Admin)**
* จัดการข้อมูลสินค้า (เพิ่ม/แก้ไข/ลบ)
* จัดการหมวดหมู่/แบรนด์สินค้า
* ดูรายงานยอดขายและคำสั่งซื้อ
* จัดการผู้ใช้งานในระบบ

### 1.2 ขอบเขตของระบบ (System Scope)


1.ระบบจัดการสมาชิกและการยืนยันตัวตน: ครอบคลุมการสมัครสมาชิก เข้าสู่ระบบ และการเชื่อมต่อผ่าน Google OAuth
2.ระบบจัดการข้อมูลสินค้าและคลังสินค้า: จัดการข้อมูลรองเท้าและระบบตัดสต็อกแบบเจาะจงตามไซส์ (EU Size)
3.ระบบค้นหาและแสดงผลสินค้า: ครอบคลุมการกรองสินค้าตามแบรนด์และราคา พร้อมแสดงรายละเอียดสินค้าที่ครบถ้วน
4.ระบบตะกร้าสินค้าและรายการที่ชอบ: การคำนวณราคาสินค้าในตะกร้า (Shopping Cart) และระบบ Wishlist
5.ระบบสั่งซื้อและโปรโมชั่น: การสร้างคำสั่งซื้อ การคำนวณส่วนลดจาก Promo Code และระบบ Flash Sale
6.ระบบการชำระเงิน: รองรับการยืนยันการสั่งซื้อผ่านการอัปโหลดหลักฐานการโอนเงิน (สลิปโอนเงิน)
7.ระบบติดตามคำสั่งซื้อ: การแสดงประวัติการสั่งซื้อและสถานะพัสดุสำหรับลูกค้า
8.ระบบรีวิวสินค้า: รองรับการให้คะแนนดาว เขียนความคิดเห็น และอัปโหลดรูปภาพรีวิวจากผู้ใช้งานจริง
9.ระบบจัดการหลังบ้าน (Admin Panel): แผงควบคุมสำหรับผู้ดูแลระบบในการจัดการคำสั่งซื้อ สินค้า โปรโมชั่น รีวิว และแสดงรายงานสรุปผล (Dashboard)

### 2. แผนภาพยูสเคส (Use Case Diagram)
![Use Case Diagram](UseCase.png)

```mermaid
flowchart LR
    %% Actors
    User([ผู้ใช้งาน])
    Admin([แอดมิน])

    %% User Use Cases
    UC1([สมัครสมาชิก / เข้าสู่ระบบ])
    UC2([ค้นหาและดูสินค้า])
    UC2_1([ค้นหาด้วยชื่อสินค้า])
    UC2_2([ค้นหาด้วยรหัสสินค้า])
    UC3([ดูรายละเอียดสินค้า])
    UC3_1([แสดงสินค้าคงเหลือ])
    UC3_2([เพิ่มเข้ารายการโปรด])
    UC4([จัดการตะกร้าสินค้า])
    UC4_1([แก้ไขจำนวนสินค้า])
    UC4_2([ลบรายการสินค้าออกจากตะกร้า])
    UC5([สั่งซื้อสินค้า])
    UC5_1([ระบุที่อยู่จัดส่ง])
    UC5_2([ช่องทางการจัดส่ง])
    UC6([ชำระเงิน])
    UC6_1([ชำระเงินผ่านคิวอาร์])
    UC6_2([ชำระเงินผ่านพร้อมเพย์])
    UC7([ดูประวัติคำสั่งซื้อ])
    UC8([ติดตามสถานะคำสั่งซื้อ])

    %% Admin Use Cases
    UC9([จัดการข้อมูลสินค้า])
    UC9_1([เพิ่มสินค้า / ลบสินค้า])
    UC9_2([แก้ไขรายละเอียดสินค้า])
    UC10([จัดการคำสั่งซื้อ])
    UC10_1([อัพเดตสถานะการส่ง])
    UC10_2([กรองดูรายการคำสั่งซื้อ])
    UC11([จัดการผู้ใช้งาน])
    UC11_1([แก้ไขบทบาท])
    UC12([สรุปยอดขาย])

    %% Connections for User
    User --- UC1
    User --- UC2
    User --- UC3
    User --- UC4
    User --- UC5
    User --- UC6
    User --- UC7
    User --- UC8

    UC2_1 --> UC2
    UC2_2 --> UC2
    
    UC3 -. include .-> UC3_1
    UC3_2 -. Extend .-> UC3
    
    UC4_1 -. Extend .-> UC4
    UC4_2 -. Extend .-> UC4
    
    UC5 -. include .-> UC5_1
    UC5 -. include .-> UC5_2
    
    UC6_1 --> UC6
    UC6_2 --> UC6

    %% Connections for Admin
    Admin --- UC9
    Admin --- UC10
    Admin --- UC11
    Admin --- UC12
    
    %% Dashed line from User's history to Admin (as in diagram)
    UC7 -.- Admin

    UC9_1 -. Extend .-> UC9
    UC9_2 -. Extend .-> UC9
    
    UC10_1 -. Extend .-> UC10
    UC10_2 -. Extend .-> UC10
    
    UC11_1 -. Extend .-> UC11
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

**ดู:** [System Architecture →](architecture.md)
