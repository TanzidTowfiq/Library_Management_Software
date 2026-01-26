import axios from 'axios';
import { useEffect, useState } from 'react';
import './MyPendingRequests.css';

function MyPendingRequests({ onUpdate }) {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const username = localStorage.getItem('username');

  useEffect(() => {
    fetchPendingRequests();
  }, [onUpdate]);

  const fetchPendingRequests = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/books/my-requests?username=${username}`);
      const pending = res.data.filter((r) => r.status === 'pending');
      setPendingRequests(pending);
    } catch (err) {
      console.error('Error fetching pending requests:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-state">Loading...</div>;
  }

  if (pendingRequests.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">⏳</div>
        <h3>No pending requests</h3>
        <p>You don't have any pending book requests. Browse the collection to request a book!</p>
      </div>
    );
  }

  return (
    <div className="pending-requests">
      <h2>Pending Requests</h2>
      <div className="requests-list">
        {pendingRequests.map((request) => (
          <div key={request._id} className="request-card">
            <div className="request-content">
              <div className="book-icon">📖</div>
              <div className="book-info">
                <h3 className="book-title">{request.bookTitle}</h3>
                <p className="book-author">by {request.bookAuthor}</p>
                <p className="request-date">Requested on: {new Date(request.requestedAt).toLocaleString()}</p>
                <div className="request-status">
                  <span className="badge badge-pending">⏳ Pending Approval</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MyPendingRequests;
