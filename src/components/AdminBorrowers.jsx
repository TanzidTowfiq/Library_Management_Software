import axios from 'axios';
import { useEffect, useState } from 'react';
import './AdminBorrowers.css';

function AdminBorrowers({ onReturn }) {
  const [borrowers, setBorrowers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBorrowers();
  }, []);

  const fetchBorrowers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/borrowers');
      setBorrowers(res.data);
    } catch (err) {
      console.error('Error fetching borrowers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (bookId, username) => {
    if (!window.confirm(`Mark this book as returned for ${username}?`)) return;

    try {
      await axios.put(`http://localhost:5000/api/admin/return/${bookId}`, { username });
      fetchBorrowers();
      if (onReturn) onReturn();
      alert('Book marked as returned successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to return book');
    }
  };

  if (loading) {
    return <div className="loading-state">Loading borrower statistics...</div>;
  }

  if (borrowers.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">👥</div>
        <h3>No active borrowers</h3>
        <p>There are currently no books borrowed by students.</p>
      </div>
    );
  }

  return (
    <div className="admin-borrowers">
      <h2>Borrower Statistics</h2>
      <div className="borrowers-list">
        {borrowers.map((borrower, index) => (
          <div key={borrower.username} className="borrower-card">
            <div className="borrower-header">
              <div className="borrower-info">
                <div className="borrower-rank">#{index + 1}</div>
                <div>
                  <h3 className="borrower-name">👤 {borrower.username}</h3>
                  <p className="borrower-count">
                    {borrower.totalBorrowed} {borrower.totalBorrowed === 1 ? 'book' : 'books'} borrowed
                  </p>
                </div>
              </div>
            </div>

            <div className="borrowed-books-list">
              <h4>Borrowed Books:</h4>
              {borrower.books.map((book, bookIndex) => (
                <div key={bookIndex} className="borrowed-book-item">
                  <div className="book-details">
                    <div className="book-icon-small">📖</div>
                    <div>
                      <p className="book-title-small">{book.title}</p>
                      <p className="book-author-small">by {book.author}</p>
                      <p className="borrowed-date-small">Since: {new Date(book.borrowedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button className="btn-sm btn-success" onClick={() => handleReturn(book.bookId, borrower.username)}>
                    ↩️ Return
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminBorrowers;
