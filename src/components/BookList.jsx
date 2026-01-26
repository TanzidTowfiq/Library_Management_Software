import axios from 'axios';
import { useEffect, useState } from 'react';
import './BookList.css';

function BookList({ books, deleteBook, issueBook, role, onRequestBook, onToggleFavorite }) {
  const [favorites, setFavorites] = useState([]);
  const [requests, setRequests] = useState([]);
  const username = localStorage.getItem('username');

  useEffect(() => {
    if (role === 'student' && username) {
      fetchFavorites();
      fetchRequests();
    }
  }, [role, username]);

  const fetchFavorites = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/books/my-favorites?username=${username}`);
      setFavorites(res.data.map((b) => b._id));
    } catch (err) {
      console.error('Error fetching favorites:', err);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/books/my-requests?username=${username}`);
      setRequests(res.data.filter((r) => r.status === 'pending').map((r) => r.bookId));
    } catch (err) {
      console.error('Error fetching requests:', err);
    }
  };

  const handleRequest = async (bookId) => {
    try {
      await axios.post(`http://localhost:5000/api/books/request/${bookId}`, { username });
      // Refresh from server to ensure consistency
      await fetchRequests();
      if (onRequestBook) onRequestBook();
      alert('Book request submitted successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to request book');
      // Refresh requests on error to get current state
      await fetchRequests();
    }
  };

  const handleToggleFavorite = async (bookId) => {
    try {
      const res = await axios.post(`http://localhost:5000/api/books/favorite/${bookId}`, { username });
      // Refresh favorites from server to ensure consistency
      await fetchFavorites();
      if (onToggleFavorite) onToggleFavorite();
    } catch (err) {
      console.error('Error toggling favorite:', err);
      alert(err.response?.data?.message || 'Failed to update favorite');
    }
  };

  if (books.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📚</div>
        <h3>No books found</h3>
        <p>Try adjusting your search or add new books to the collection.</p>
      </div>
    );
  }

  return (
    <div className="book-list">
      {books.map((book) => {
        // Convert both to strings for reliable comparison
        const bookIdStr = String(book._id);
        const isFavorite = favorites.some((favId) => String(favId) === bookIdStr);
        const isRequested = requests.some((reqId) => String(reqId) === bookIdStr);

        return (
          <div key={book._id} className="book-card">
            <div className="book-content">
              <div className="book-icon">📖</div>
              <div className="book-info">
                <h3 className="book-title">{book.title}</h3>
                <p className="book-author">by {book.author}</p>
                <div className="book-status">
                  <span className={`badge ${book.issued ? 'badge-warning' : 'badge-success'}`}>{book.issued ? '📤 Issued' : '✅ Available'}</span>
                </div>
              </div>
            </div>

            {role === 'admin' && (
              <div className="book-actions">
                <button className={`btn-sm ${book.issued ? 'btn-success' : 'btn-primary'}`} onClick={() => issueBook(book._id)}>
                  {book.issued ? '↩️ Return' : '📤 Issue'}
                </button>
                <button
                  className="btn-sm btn-danger"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete "${book.title}"?`)) {
                      deleteBook(book._id);
                    }
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            )}

            {role === 'student' && (
              <div className="book-actions">
                <button
                  className={`btn-sm ${isFavorite ? 'btn-warning' : 'btn-outline'}`}
                  onClick={() => handleToggleFavorite(book._id)}
                  title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {isFavorite ? '⭐ Favorited' : '⭐ Favorite'}
                </button>
                {!book.issued && (
                  <button className={`btn-sm ${isRequested ? 'btn-secondary' : 'btn-primary'}`} onClick={() => handleRequest(book._id)} disabled={isRequested}>
                    {isRequested ? '✅ Requested' : '📝 Request Book'}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default BookList;
