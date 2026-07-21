import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProductReviews = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // ฟังก์ชันส่งรีวิว (ต้องใช้ Token เพื่อระบุตัวตนลูกค้า)
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    
    if (!token) {
      alert('กรุณาเข้าสู่ระบบก่อนเขียนรีวิวครับ!');
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
      
      setComment('');
      setRating(5);
      setImage(null);
      setImagePreview(null);
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาด หรือเซสชันของคุณหมดอายุ กรุณาล็อกอินใหม่');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ width: '100%', marginTop: '36px' }}>
      {/* Header */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 0',
          borderBottom: '2px solid #e2e8f0',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderBottomColor = '#94a3b8';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderBottomColor = '#e2e8f0';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>⭐</span>
          <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#1e293b' }}>
            รีวิวจากลูกค้า
            <span style={{ 
              display: 'inline-block',
              marginLeft: '6px',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              paddingLeft: '7px',
              paddingRight: '7px',
              borderRadius: '3px',
              fontSize: '13px',
              fontWeight: '600'
            }}>
              {reviews.length}
            </span>
          </h3>
        </div>
        <span style={{ fontSize: '16px', transition: 'transform 0.3s ease', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▼
        </span>
      </div>

      {isOpen && (
        <div style={{ paddingTop: '18px' }}>
          {/* Form Section */}
          <form onSubmit={handleSubmitReview} style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '11px',
            padding: '20px',
            marginBottom: '22px'
          }}>
            <h4 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 14px 0', color: '#1e293b' }}>
              ✍️ เขียนรีวิวของคุณ
            </h4>
            
            {/* Rating Selector */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '10px', color: '#475569' }}>
                เลือกคะแนน
              </label>
              <select 
                value={rating} 
                onChange={(e) => setRating(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  backgroundColor: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#cbd5e1';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <option value="5">⭐⭐⭐⭐⭐ 5 ดาว - ดีเยี่ยม</option>
                <option value="4">⭐⭐⭐⭐ 4 ดาว - ดี</option>
                <option value="3">⭐⭐⭐ 3 ดาว - ปานกลาง</option>
                <option value="2">⭐⭐ 2 ดาว - พอใช้</option>
                <option value="1">⭐ 1 ดาว - แย่</option>
              </select>
            </div>

            {/* Comment Textarea */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '10px', color: '#475569' }}>
                ความเห็นของคุณ
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="แชร์ความรู้สึกที่มีต่อสินค้านี้..."
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  minHeight: '88px',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#cbd5e1';
                  e.target.style.boxShadow = 'none';
                }}
                required
              />
            </div>

            {/* Image Upload */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '10px', color: '#475569' }}>
                แนบรูปภาพรีวิว (ถ้ามี)
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  setImage(file);
                  setImagePreview(URL.createObjectURL(file));
                }}
                style={{
                  width: '100%',
                  padding: '10px 10px 6px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  backgroundColor: '#ffffff',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              />
              {imagePreview && (
                <div style={{ marginTop: '10px' }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '11px',
                backgroundColor: isSubmitting ? '#94a3b8' : '#000000',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.target.style.backgroundColor = '#1e293b';
                  e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  e.target.style.backgroundColor = '#000000';
                  e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                }
              }}
            >
              {isSubmitting ? '⏳ กำลังส่ง...' : '📤 ส่งรีวิว'}
            </button>
          </form>

          {/* Reviews List */}
          <div>
            {reviews.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '36px 20px',
                backgroundColor: '#f8fafc',
                borderRadius: '10px',
                border: '1px dashed #cbd5e1'
              }}>
                <span style={{ fontSize: '28px', display: 'block', marginBottom: '10px' }}>📭</span>
                <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>ยังไม่มีรีวิวสำหรับสินค้านี้</p>
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: '8px 0 0 0' }}>เป็นคนแรกที่รีวิวสินค้านี้!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '14px' }}>
                {reviews.map((review) => (
                  <div 
                    key={review.id}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '14px',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                      e.currentTarget.style.borderColor = '#cbd5e1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }}
                  >
                    {/* Rating & Name & Date */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#f59e0b', letterSpacing: '1.5px' }}>
                          {'★'.repeat(review.rating)}<span style={{ color: '#d1d5db' }}>{'★'.repeat(5 - review.rating)}</span>
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                          {review.user_name || 'Customer'}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {new Date(review.created_at).toLocaleDateString('th-TH')}
                      </span>
                    </div>

                    {/* Comment */}
                    <p style={{ 
                      color: '#475569', 
                      fontSize: '14px', 
                      lineHeight: '1.5', 
                      margin: 0,
                      paddingLeft: '8px',
                      borderLeft: '3px solid #e0e7ff'
                    }}>
                      {review.comment}
                    </p>

                    {review.image && (
                      <div style={{ marginTop: '14px', textAlign: 'center' }}>
                        <img
                          src={review.image.startsWith('http') ? review.image : `http://localhost:5000${review.image}`}
                          alt="Customer review"
                          style={{ width: '100%', maxHeight: '260px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #e2e8f0' }}
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
