import { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminRequests.css';

function AdminRequests({ onUpdate }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected

  const fetchRequests = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/requests');
      setRequests(res.data);
    } catch (err) {
      console.error('Error fetching requests:', err);
      alert('Failed to fetch requests. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    
    // Auto-refresh requests every 30 seconds
    const interval = setInterval(() => {
      fetchRequests();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (requestId) => {
    if (!window.confirm('Are you sure you want to approve this request? The book will be issued to the student.')) return;
    
    try {
      await axios.put(`http://localhost:5000/api/admin/requests/${requestId}/approve`);
      await fetchRequests();
      if (onUpdate) onUpdate();
      alert('Request approved successfully! The book has been issued to the student.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve request');
      await fetchRequests(); // Refresh to get current state
    }
  };

  const handleReject = async (requestId) => {
    if (!window.confirm('Are you sure you want to reject this request?')) return;
    
    try {
      await axios.put(`http://localhost:5000/api/admin/requests/${requestId}/reject`);
      await fetchRequests();
      alert('Request rejected');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject request');
      await fetchRequests(); // Refresh to get current state
    }
  };

  const filteredRequests = filter === 'all' 
    ? requests 
    : requests.filter(r => r.status === filter);

  if (loading) {
    return <div className="loading-state">Loading requests...</div>;
  }

  if (filteredRequests.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📋</div>
        <h3>No requests found</h3>
        <p>{filter === 'all' ? 'There are no book requests yet.' : `No ${filter} requests.`}</p>
      </div>
    );
  }

  return (
    <div className="admin-requests">
      <div className="requests-header">
        <div className="header-title-section">
          <h2>Book Requests</h2>
          <button 
            className="btn-sm btn-outline refresh-btn"
            onClick={fetchRequests}
            title="Refresh requests"
          >
            🔄 Refresh
          </button>
        </div>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({requests.length})
          </button>
          <button
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending ({requests.filter(r => r.status === 'pending').length})
          </button>
          <button
            className={`filter-btn ${filter === 'approved' ? 'active' : ''}`}
            onClick={() => setFilter('approved')}
          >
            Approved ({requests.filter(r => r.status === 'approved').length})
          </button>
          <button
            className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`}
            onClick={() => setFilter('rejected')}
          >
            Rejected ({requests.filter(r => r.status === 'rejected').length})
          </button>
        </div>
      </div>

      <div className="requests-list">
        {filteredRequests.map((request) => (
          <div key={request._id} className="request-card">
            <div className="request-content">
              <div className="request-icon">📖</div>
              <div className="request-info">
                <h3 className="request-title">{request.bookTitle}</h3>
                <p className="request-author">by {request.bookAuthor}</p>
                <p className="request-student">
                  <strong>Student:</strong> {request.username}
                </p>
                <p className="request-date">
                  Requested: {new Date(request.requestedAt).toLocaleString()}
                </p>
                {request.approvedAt && (
                  <p className="request-date">
                    Approved: {new Date(request.approvedAt).toLocaleString()}
                  </p>
                )}
                {request.rejectedAt && (
                  <p className="request-date">
                    Rejected: {new Date(request.rejectedAt).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="request-status">
                <span className={`badge badge-${request.status}`}>
                  {request.status === 'pending' && '⏳ Pending'}
                  {request.status === 'approved' && '✅ Approved'}
                  {request.status === 'rejected' && '❌ Rejected'}
                </span>
              </div>
            </div>
            
            {request.status === 'pending' && (
              <div className="request-actions">
                <button
                  className="btn-sm btn-success"
                  onClick={() => handleApprove(request._id)}
                >
                  ✅ Approve
                </button>
                <button
                  className="btn-sm btn-danger"
                  onClick={() => handleReject(request._id)}
                >
                  ❌ Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminRequests;
