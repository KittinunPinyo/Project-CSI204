import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ManageReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchAdminReviews();
  }, []);

  const fetchAdminReviews = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const response = await axios.get('http://localhost:5000/api/admin/reviews', config);
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching admin reviews', error);
      if (error.response?.status === 403) alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (เฉพาะ Admin)');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.delete(`http://localhost:5000/api/admin/reviews/${reviewId}`, config);
      setReviews(reviews.filter(r => r.id !== reviewId));
      setDeleteId(null);
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการลบรีวิว');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
        <p style={{ color: '#64748b', fontWeight: '500' }}>กำลังโหลดข้อมูลรีวิว...</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#F8F6F3', padding: '32px 24px' }}>
      <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '28px', backgroundColor: '#ffffff', border: '1px solid #E8E1D9', borderRadius: '20px', padding: '28px 32px', boxShadow: '0 8px 20px rgba(92, 78, 67, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '24px' }}>⭐</span>
            <h2 style={{ fontSize: '24px', fontWeight: '900', margin: 0, letterSpacing: '0.5px', color: '#5C4E43' }}>
              จัดการรีวิวจากลูกค้า
            </h2>
          </div>
          <p style={{ color: '#64748b', margin: '8px 0 0 0', fontSize: '14px' }}>
            จำนวนรีวิวทั้งหมด: <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{reviews.length}</span> รายการ
          </p>
        </div>

        {reviews.length === 0 ? (
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px dashed #E8E1D9',
            borderRadius: '20px',
            padding: '56px 28px',
            textAlign: 'center',
            boxShadow: '0 8px 20px rgba(92, 78, 67, 0.04)'
          }}>
            <span style={{ fontSize: '44px', display: 'block', marginBottom: '14px' }}>📝</span>
            <p style={{ color: '#64748b', fontSize: '15px', margin: 0 }}>ยังไม่มีรีวิวในระบบ</p>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: '8px 0 0 0' }}>รีวิวจากลูกค้าจะปรากฏที่นี่เมื่อมีการส่งรีวิว</p>
          </div>
        ) : (
        <div style={{ display: 'grid', gap: '18px' }}>
          {reviews.map((review) => (
            <div 
              key={review.id}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #E8E1D9',
                borderRadius: '20px',
                padding: '22px',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 20px rgba(92, 78, 67, 0.05)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              {/* Header Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 140px', gap: '16px', marginBottom: '12px' }}>
                {/* Product Info */}
                <div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    สินค้า
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>
                    {review.product_name || '❓ ไม่ทราบชื่อสินค้า'}
                  </div>
                </div>

                {/* User Info */}
                <div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    ลูกค้า
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>
                    👤 {review.user_name || 'ลูกค้าไม่ระบุชื่อ'}
                  </div>
                </div>

                {/* Rating & Date */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '6px', letterSpacing: '1.5px' }}>
                    {'★'.repeat(review.rating)}<span style={{ color: '#d1d5db' }}>{'★'.repeat(5 - review.rating)}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {new Date(review.created_at).toLocaleDateString('th-TH')}
                  </div>
                </div>
              </div>

              {/* Comment Section */}
              <div style={{ backgroundColor: '#F8F6F3', padding: '14px', borderRadius: '14px', marginBottom: '16px', borderLeft: '4px solid #8C7A6B' }}>
                <div style={{ fontSize: '11px', color: '#5C4E43', fontWeight: '600', marginBottom: '6px' }}>ความเห็นของลูกค้า</div>
                <p style={{ color: '#334155', fontSize: '14px', lineHeight: '1.75', margin: 0 }}>
                  {review.comment}
                </p>
              </div>

              {review.image && (
                <div style={{ marginBottom: '14px', textAlign: 'center' }}>
                  <img
                    src={review.image.startsWith('http') ? review.image : `http://localhost:5000${review.image}`}
                    alt="Review image"
                    style={{ width: '100%', maxHeight: '260px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setDeleteId(review.id)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#dc2626';
                    e.target.style.boxShadow = '0 4px 8px rgba(239, 68, 68, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#ef4444';
                    e.target.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.2)';
                  }}
                >
                  🗑️ ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '32px',
            maxWidth: '420px',
            width: '100%',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)',
            animation: 'slideUp 0.3s ease'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '48px', display: 'block', marginBottom: '14px' }}>⚠️</span>
              <h3 style={{ fontSize: '18px', fontWeight: '900', margin: '0 0 12px 0', color: '#1e293b' }}>
                ยืนยันการลบรีวิว
              </h3>
              <p style={{ color: '#64748b', fontSize: '14px', margin: '0', lineHeight: '1.5' }}>
                คุณแน่ใจที่ต้องการลบรีวิวนี้หรือไม่? การกระทำนี้ไม่สามารถยกเลิกได้
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setDeleteId(null)}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  color: '#475569',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f1f5f9';
                  e.target.style.borderColor = '#94a3b8';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#ffffff';
                  e.target.style.borderColor = '#cbd5e1';
                }}
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleDeleteReview(deleteId)}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: 'none',
                  backgroundColor: '#ef4444',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  color: '#ffffff',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 8px rgba(239, 68, 68, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#dc2626';
                  e.target.style.boxShadow = '0 6px 12px rgba(239, 68, 68, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#ef4444';
                  e.target.style.boxShadow = '0 4px 8px rgba(239, 68, 68, 0.2)';
                }}
              >
                ลบถาวร
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  );
};

export default ManageReviews;
