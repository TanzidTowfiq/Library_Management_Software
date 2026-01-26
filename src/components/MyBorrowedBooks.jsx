import axios from 'axios';
import { useEffect, useState } from 'react';
import './MyBorrowedBooks.css';

function MyBorrowedBooks() {
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  const username = localStorage.getItem('username');

  useEffect(() => {
    fetchBorrowedBooks();
  }, []);

  const fetchBorrowedBooks = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/books/my-borrowed?username=${username}`);
      setBorrowedBooks(res.data);
    } catch (err) {
      console.error('Error fetching borrowed books:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-state">Loading...</div>;
  }

  if (borrowedBooks.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📚</div>
        <h3>No borrowed books</h3>
        <p>You haven't borrowed any books yet. Request a book to get started!</p>
      </div>
    );
  }

  return (
    <div className="borrowed-books">
      <h2>My Borrowed Books</h2>
      <div className="borrowed-list">
        {borrowedBooks.map((borrow) => (
          <div key={borrow._id} className="borrowed-card">
            <div className="borrowed-content">
              <div className="book-icon">📖</div>
              <div className="book-info">
                <h3 className="book-title">{borrow.bookTitle}</h3>
                <p className="book-author">by {borrow.bookAuthor}</p>
                <p className="borrowed-date">Borrowed on: {new Date(borrow.borrowedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MyBorrowedBooks;
