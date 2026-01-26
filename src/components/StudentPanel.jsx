import axios from 'axios';
import { useEffect, useState } from 'react';
import BookList from './BookList';
import MyBorrowedBooks from './MyBorrowedBooks';
import MyFavorites from './MyFavorites';
import MyPendingRequests from './MyPendingRequests';
import Notifications from './Notifications';
import SearchBar from './SearchBar';
import './StudentPanel.css';

function StudentPanel({ books, setSearch, onRequestBook, onToggleFavorite }) {
  const [activeTab, setActiveTab] = useState('collection');
  const [refreshPending, setRefreshPending] = useState(0);
  const [refreshFavorites, setRefreshFavorites] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const username = localStorage.getItem('username');

  useEffect(() => {
    fetchUnreadCount();
    // Refresh unread count every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/notifications?username=${username}`);
      const unread = res.data.filter((n) => !n.read).length;
      setUnreadNotifications(unread);
    } catch (err) {
      console.error('Error fetching notification count:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    window.location.href = '/';
  };

  const availableCount = books.filter((b) => !b.issued).length;
  const totalCount = books.length;

  const handleRequestBook = () => {
    if (onRequestBook) onRequestBook();
    // Trigger refresh of pending requests
    setRefreshPending((prev) => prev + 1);
  };

  const handleToggleFavorite = () => {
    if (onToggleFavorite) onToggleFavorite();
    // Trigger refresh of favorites
    setRefreshFavorites((prev) => prev + 1);
  };

  return (
    <div className="student-panel">
      <header className="student-header">
        <div className="header-content">
          <div className="header-left">
            <div className="header-icon">📚</div>
            <div>
              <h1>Student Portal</h1>
              <p className="header-subtitle">Welcome, {username}</p>
            </div>
          </div>
          <button className="btn-outline logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="student-main">
        <div className="container">
          <div className="student-stats">
            <div className="stat-card">
              <div className="stat-icon">📖</div>
              <div className="stat-info">
                <h3>{totalCount}</h3>
                <p>Total Books</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <h3>{availableCount}</h3>
                <p>Available Now</p>
              </div>
            </div>
          </div>

          <div className="tabs">
            <button className={`tab-btn ${activeTab === 'collection' ? 'active' : ''}`} onClick={() => setActiveTab('collection')}>
              📚 Book Collection
            </button>
            <button className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
              ⏳ Pending Requests
            </button>
            <button className={`tab-btn ${activeTab === 'borrowed' ? 'active' : ''}`} onClick={() => setActiveTab('borrowed')}>
              📖 My Borrowed Books
            </button>
            <button className={`tab-btn ${activeTab === 'favorites' ? 'active' : ''}`} onClick={() => setActiveTab('favorites')}>
              ⭐ My Favorites
            </button>
            <button
              className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('notifications');
                fetchUnreadCount();
              }}
            >
              🔔 Notifications
              {unreadNotifications > 0 && <span className="notification-badge">{unreadNotifications}</span>}
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'collection' && (
              <div className="student-section">
                <div className="section-header">
                  <h2>Book Collection</h2>
                  <SearchBar setSearch={setSearch} />
                </div>
                <BookList books={books} role="student" onRequestBook={handleRequestBook} onToggleFavorite={handleToggleFavorite} />
              </div>
            )}
            {activeTab === 'pending' && <MyPendingRequests key={refreshPending} onUpdate={refreshPending} />}
            {activeTab === 'borrowed' && <MyBorrowedBooks />}
            {activeTab === 'favorites' && <MyFavorites key={refreshFavorites} onToggleFavorite={handleToggleFavorite} />}
            {activeTab === 'notifications' && <Notifications onUpdate={fetchUnreadCount} />}
          </div>
        </div>
      </main>
    </div>
  );
}

export default StudentPanel;
