import axios from 'axios';
import { useEffect, useState } from 'react';
import './MyFavorites.css';

function MyFavorites({ onToggleFavorite }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const username = localStorage.getItem('username');

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/books/my-favorites?username=${username}`);
      setFavorites(res.data);
    } catch (err) {
      console.error('Error fetching favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (bookId) => {
    try {
      await axios.post(`http://localhost:5000/api/books/favorite/${bookId}`, {
        username,
      });
      await fetchFavorites();
      if (onToggleFavorite) onToggleFavorite();
    } catch (err) {
      console.error('Error removing favorite:', err);
    }
  };

  if (loading) {
    return <div className="loading-state">Loading...</div>;
  }

  if (favorites.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">⭐</div>
        <h3>No favorites yet</h3>
        <p>Add books to your favorites to easily find them later!</p>
      </div>
    );
  }

  return (
    <div className="favorites">
      <h2>My Favorites</h2>
      <div className="favorites-list">
        {favorites.map((book) => (
          <div key={book._id} className="favorite-card">
            <div className="favorite-content">
              <div className="book-icon">📖</div>
              <div className="book-info">
                <h3 className="book-title">{book.title}</h3>
                <p className="book-author">by {book.author}</p>
                <div className="book-status">
                  <span className={`badge ${book.issued ? 'badge-warning' : 'badge-success'}`}>{book.issued ? '📤 Issued' : '✅ Available'}</span>
                </div>
              </div>
            </div>
            <button className="btn-sm btn-outline remove-favorite-btn" onClick={() => handleRemoveFavorite(book._id)}>
              ❌ Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MyFavorites;
