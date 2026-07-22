import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProductReviews = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [comment, setComment] = useState('');
  
  // 🌟 State สำหรับระบบดาว
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🌟 State สำหรับป๊อปอัปแจ้งเตือน (Toast)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  // ดึงข้อมูลรีวิว (ทั้งหมด) ดึงได้เลยไม่ต้องใช้ Token
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/reviews/product/${productId}`);
        setReviews(response.data);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    };
    if (productId) fetchReviews();
  }, [productId]);

  // ฟังก์ชันล้างรูปภาพที่เลือก
  const handleClearImage = () => {
    setImage(null);
    setImagePreview(null);
    document.getElementById('review-image-upload').value = '';
  };

  // ฟังก์ชันส่งรีวิว (ต้องใช้ Token เพื่อระบุตัวตนลูกค้า)
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    
    if (!token) {
      showToast('กรุณาเข้าสู่ระบบก่อนเขียนรีวิวนะครับ!', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('productId', productId);
      formData.append('rating', rating);
      formData.append('comment', comment);
      if (image) {
        formData.append('image', image);
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      await axios.post('http://localhost:5000/api/reviews', formData, config);
      
      // รีโหลดรีวิวทันที
      const response = await axios.get(`http://localhost:5000/api/reviews/product/${productId}`);
      setReviews(response.data);
      
      showToast('ส่งรีวิวเรียบร้อยแล้ว ขอบคุณครับ!', 'success');
      
      setComment('');
      setRating(5);
      setHoverRating(0);
      handleClearImage();
    } catch (error) {
      console.error(error);
      showToast('เกิดข้อผิดพลาด หรือเซสชันของคุณหมดอายุ กรุณาล็อกอินใหม่', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ width: '100%', marginTop: '36px', position: 'relative' }}>
      
      {/* 🌟 ป๊อปอัปแจ้งเตือน (Toast) */}
      <div style={{
        position: 'fixed', top: toast.show ? '30px' : '-100px', left: '50%', transform: 'translateX(-50%)',
        backgroundColor: toast.type === 'success' ? '#5C4E43' : '#b87373', color: '#ffffff',
        padding: '14px 28px', borderRadius: '50px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        transition: 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)', zIndex: 9999,
        display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', opacity: toast.show ? 1 : 0
      }}>
        <span style={{ fontSize: '18px' }}>{toast.type === 'success' ? '✅' : '⚠️'}</span>
        {toast.message}
      </div>

      {/* Header */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '2px solid #E8E1D9', transition: 'all 0.2s ease' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>⭐</span>
          <h3 style={{ fontSize: '18px', fontWeight: '900', margin: 0, color: '#5C4E43' }}>
            รีวิวจากลูกค้า
            <span style={{ display: 'inline-block', marginLeft: '8px', backgroundColor: '#8C7A6B', color: '#ffffff', padding: '2px 10px', borderRadius: '50px', fontSize: '13px', fontWeight: 'bold' }}>
              {reviews.length}
            </span>
          </h3>
        </div>
        <span style={{ fontSize: '16px', color: '#8C7A6B', transition: 'transform 0.3s ease', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▼
        </span>
      </div>

      {isOpen && (
        <div style={{ paddingTop: '24px' }}>
          
          {/* ==============================
              ฟอร์มเขียนรีวิว
              ============================== */}
          <form onSubmit={handleSubmitReview} style={{ backgroundColor: '#ffffff', border: '1px solid #E8E1D9', borderRadius: '16px', padding: '24px', marginBottom: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '900', margin: '0 0 20px 0', color: '#5C4E43' }}>
              ✍️ เขียนรีวิวของคุณ
            </h4>
            
            {/* 🌟 ระบบให้คะแนนดาวแบบกดได้ */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#8C7A6B' }}>
                ให้คะแนนสินค้า
              </label>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    style={{
                      cursor: 'pointer',
                      fontSize: '28px',
                      lineHeight: '1',
                      color: star <= (hoverRating || rating) ? '#f59e0b' : '#E8E1D9',
                      transition: 'color 0.2s',
                      userSelect: 'none'
                    }}
                  >
                    ★
                  </span>
                ))}
                <span style={{ marginLeft: '12px', fontSize: '13px', fontWeight: 'bold', color: '#8C7A6B' }}>
                  {rating === 5 ? 'ดีเยี่ยม' : rating === 4 ? 'ดี' : rating === 3 ? 'ปานกลาง' : rating === 2 ? 'พอใช้' : 'ต้องปรับปรุง'}
                </span>
              </div>
            </div>

            {/* Comment Textarea */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#8C7A6B' }}>
                ความเห็นของคุณ
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="แชร์ความรู้สึกที่มีต่อสินค้านี้..."
                style={{ width: '100%', padding: '14px', border: '1px solid #E8E1D9', borderRadius: '12px', fontSize: '14px', color: '#5C4E43', fontFamily: 'inherit', resize: 'vertical', minHeight: '100px', outline: 'none', transition: 'all 0.2s ease' }}
                onFocus={(e) => { e.target.style.borderColor = '#8C7A6B'; }}
                onBlur={(e) => { e.target.style.borderColor = '#E8E1D9'; }}
                required
              />
            </div>

            {/* 🌟 Custom Image Upload */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#8C7A6B' }}>
                แนบรูปภาพรีวิว (ถ้ามี)
              </label>
              
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                {/* ซ่อน input file ของจริง */}
                <input
                  type="file"
                  id="review-image-upload"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    setImage(file);
                    setImagePreview(URL.createObjectURL(file));
                  }}
                  style={{ display: 'none' }}
                />
                
                {/* ปุ่มปลอมที่หน้าตาสวยงาม */}
                <label
                  htmlFor="review-image-upload"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', backgroundColor: '#F0EBE6', color: '#5C4E43', borderRadius: '50px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', border: '1px solid #E8E1D9', transition: 'all 0.2s', margin: 0 }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#E8E1D9'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#F0EBE6'}
                >
                  📸 {image ? 'เปลี่ยนรูปภาพ' : 'แนบรูปภาพ'}
                </label>

                {/* พรีวิวรูปภาพ */}
                {imagePreview && (
                  <div style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '12px', border: '1px solid #E8E1D9', overflow: 'hidden' }}>
                    <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={handleClearImage}
                      style={{ position: 'absolute', top: '4px', right: '4px', width: '24px', height: '24px', backgroundColor: 'rgba(92, 78, 67, 0.8)', color: 'white', border: 'none', borderRadius: '50%', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={isSubmitting}
              style={{ width: '100%', padding: '14px', backgroundColor: isSubmitting ? '#E8E1D9' : '#8C7A6B', color: isSubmitting ? '#8C7A6B' : '#ffffff', border: 'none', borderRadius: '50px', fontWeight: 'bold', fontSize: '15px', cursor: isSubmitting ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)' }}
              onMouseEnter={(e) => { if (!isSubmitting) e.target.style.backgroundColor = '#5C4E43'; }}
              onMouseLeave={(e) => { if (!isSubmitting) e.target.style.backgroundColor = '#8C7A6B'; }}
            >
              {isSubmitting ? '⏳ กำลังบันทึกรีวิว...' : 'ส่งรีวิว'}
            </button>
          </form>

          {/* ==============================
              รายการรีวิว
              ============================== */}
          <div>
            {reviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', backgroundColor: '#F8F6F3', borderRadius: '16px', border: '1px dashed #E8E1D9' }}>
                <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>📭</span>
                <p style={{ color: '#5C4E43', fontSize: '15px', fontWeight: 'bold', margin: 0 }}>ยังไม่มีรีวิวสำหรับสินค้านี้</p>
                <p style={{ color: '#8C7A6B', fontSize: '13px', margin: '8px 0 0 0' }}>เป็นคนแรกที่รีวิวสินค้านี้เพื่อเป็นแนวทางให้เพื่อนๆ สิครับ!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {reviews.map((review) => (
                  <div 
                    key={review.id}
                    style={{ backgroundColor: '#ffffff', border: '1px solid #E8E1D9', borderRadius: '16px', padding: '20px', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)' }}
                  >
                    {/* Rating & Name & Date */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '16px', color: '#f59e0b', letterSpacing: '2px' }}>
                          {'★'.repeat(review.rating)}<span style={{ color: '#E8E1D9' }}>{'★'.repeat(5 - review.rating)}</span>
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: '900', color: '#5C4E43' }}>
                          {review.user_name || 'Customer'}
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', color: '#8C7A6B', fontWeight: 'bold' }}>
                        {new Date(review.created_at).toLocaleDateString('th-TH')}
                      </span>
                    </div>

                    {/* Comment */}
                    <p style={{ color: '#5C4E43', fontSize: '14px', lineHeight: '1.6', margin: 0, paddingLeft: '12px', borderLeft: '3px solid #E8E1D9' }}>
                      {review.comment}
                    </p>

                    {/* Image (If any) */}
                    {review.image && (
                      <div style={{ marginTop: '16px' }}>
                        <img
                          src={review.image.startsWith('http') ? review.image : `http://localhost:5000${review.image}`}
                          alt="Customer review"
                          style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '12px', border: '1px solid #E8E1D9', cursor: 'pointer' }}
                          onClick={() => window.open(review.image.startsWith('http') ? review.image : `http://localhost:5000${review.image}`, '_blank')}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default ProductReviews;