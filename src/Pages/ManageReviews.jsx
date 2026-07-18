import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ManageReviews = () => {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetchAdminReviews();
  }, []);

  const fetchAdminReviews = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const response = await axios.get('http://localhost:5000/api/admin/reviews', config);
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching admin reviews', error);
      if (error.response?.status === 403) alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (เฉพาะ Admin)');
    }
  };

  const handleUpdateStatus = async (reviewId, newStatus) => {
    if (!window.confirm(`คุณต้องการ ${newStatus === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'} รีวิวนี้ใช่หรือไม่?`)) return;
    
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.put(`http://localhost:5000/api/admin/reviews/${reviewId}/status`, { status: newStatus }, config);
      
      // อัปเดต State ให้ UI เปลี่ยนทันที
      setReviews(reviews.map(r => r._id === reviewId ? { ...r, status: newStatus } : r));
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md w-full">
      <h2 className="text-2xl font-bold mb-6 border-b pb-2">จัดการรีวิว (Manage Reviews)</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border-collapse border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-3 text-left">สินค้า</th>
              <th className="border p-3 text-left">ลูกค้า</th>
              <th className="border p-3 text-center">คะแนน</th>
              <th className="border p-3 text-left w-1/3">คอมเมนต์</th>
              <th className="border p-3 text-center">สถานะ</th>
              <th className="border p-3 text-center w-40">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review._id} className="hover:bg-gray-50">
                <td className="border p-3">{review.productId?.name || 'Unknown Product'}</td>
                <td className="border p-3">{review.userId?.name || 'Unknown User'}</td>
                <td className="border p-3 text-center text-yellow-500 font-bold">{'★'.repeat(review.rating)}</td>
                <td className="border p-3">{review.comment}</td>
                <td className="border p-3 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    review.status === 'approved' ? 'bg-green-100 text-green-700' : 
                    review.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {review.status.toUpperCase()}
                  </span>
                </td>
                <td className="border p-3 text-center space-x-2">
                  {review.status === 'pending' && (
                    <div className="flex justify-center space-x-2">
                      <button 
                        onClick={() => handleUpdateStatus(review._id, 'approved')}
                        className="bg-green-500 text-white px-3 py-1 rounded shadow hover:bg-green-600 transition-colors text-sm"
                      >
                        ✔ อนุมัติ
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(review._id, 'rejected')}
                        className="bg-red-500 text-white px-3 py-1 rounded shadow hover:bg-red-600 transition-colors text-sm"
                      >
                        ✖ ปฏิเสธ
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageReviews;