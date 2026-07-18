import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProductReviews = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const [isOpen, setIsOpen] = useState(false);

  // ดึงข้อมูลรีวิว (เฉพาะที่อนุมัติแล้ว) ดึงได้เลยไม่ต้องใช้ Token
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
    
    // ดึง Token ที่เก็บไว้ตอน Login (ปรับชื่อ 'token' ให้ตรงกับที่คุณใช้ในโปรเจกต์)
    const token = localStorage.getItem('token'); 
    
    if (!token) {
      alert('กรุณาเข้าสู่ระบบก่อนเขียนรีวิวครับ!');
      return;
    }

    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      await axios.post('http://localhost:5000/api/reviews', { productId, rating, comment }, config);
      alert('ส่งรีวิวสำเร็จ! กรุณารอแอดมินตรวจสอบและอนุมัติ');
      setComment('');
      setRating(5);
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาด หรือเซสชันของคุณหมดอายุ กรุณาล็อกอินใหม่');
    }
  };

  return (
    <div className="border-t border-gray-200 mt-6 pt-4 w-full">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex justify-between items-center font-bold text-lg p-2 hover:bg-gray-50 rounded"
      >
        รีวิวจากลูกค้า ({reviews.length})
        <span>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="mt-4 px-2">
          {/* ฟอร์มเขียนรีวิว */}
          <form onSubmit={handleSubmitReview} className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-bold mb-3">เขียนรีวิวของคุณ</h4>
            <select 
              value={rating} 
              onChange={(e) => setRating(Number(e.target.value))}
              className="border p-2 rounded mb-3 w-full bg-white"
            >
              <option value="5">5 ดาว - ดีเยี่ยม</option>
              <option value="4">4 ดาว - ดี</option>
              <option value="3">3 ดาว - ปานกลาง</option>
              <option value="2">2 ดาว - พอใช้</option>
              <option value="1">1 ดาว - แย่</option>
            </select>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="แชร์ความรู้สึกที่มีต่อสินค้านี้..."
              className="border p-3 rounded w-full h-24 mb-3 outline-none resize-none"
              required
            />
            <button type="submit" className="bg-black text-white px-4 py-2 rounded w-full hover:bg-gray-800 transition-colors font-semibold">
              ส่งรีวิว
            </button>
          </form>

          {/* รายการรีวิว */}
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <p className="text-gray-500 text-center py-4">ยังไม่มีรีวิวสำหรับสินค้านี้ เป็นคนแรกที่รีวิวสิ!</p>
            ) : (
              reviews.map((review) => (
                <div key={review._id} className="border-b pb-4 last:border-0">
                  <div className="flex items-center mb-2">
                    <span className="text-yellow-500 font-bold tracking-widest">{'★'.repeat(review.rating)}</span>
                    <span className="text-gray-300 tracking-widest">{'★'.repeat(5 - review.rating)}</span>
                    <span className="ml-3 font-semibold text-gray-800">{review.userId?.name || 'Customer'}</span>
                    <span className="ml-auto text-sm text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString('th-TH')}
                    </span>
                  </div>
                  <p className="text-gray-700">{review.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductReviews;