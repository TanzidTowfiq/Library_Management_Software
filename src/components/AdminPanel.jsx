import { useState } from "react";
import BookForm from "./BookForm";
import BookList from "./BookList";
import SearchBar from "./SearchBar";
import AdminRequests from "./AdminRequests";
import AdminBorrowers from "./AdminBorrowers";
import './AdminPanel.css';

function AdminPanel({ books, addBook, deleteBook, issueBook, setSearch, fetchBooks }) {
  const [activeTab, setActiveTab] = useState('books');
  const [refreshRequests, setRefreshRequests] = useState(0);
  const username = localStorage.getItem('username');

  const handleLogout = () => {
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    window.location.href = "/";
  };

  const availableCount = books.filter(b => !b.issued).length;
  const issuedCount = books.filter(b => b.issued).length;

  const handleUpdate = () => {
    if (fetchBooks) fetchBooks();
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Refresh requests when switching to requests tab
    if (tab === 'requests') {
      setRefreshRequests(prev => prev + 1);
    }
  };

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <div className="header-content">
          <div className="header-left">
            <div className="header-icon">📚</div>
            <div>
              <h1>Admin Dashboard</h1>
              <p className="header-subtitle">Welcome, {username}</p>
            </div>
          </div>
          <button className="btn-outline logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="admin-main">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📖</div>
              <div className="stat-info">
                <h3>{books.length}</h3>
                <p>Total Books</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <h3>{availableCount}</h3>
                <p>Available</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📤</div>
              <div className="stat-info">
                <h3>{issuedCount}</h3>
                <p>Issued</p>
              </div>
            </div>
          </div>

          <div className="tabs">
            <button
              className={`tab-btn ${activeTab === 'books' ? 'active' : ''}`}
              onClick={() => handleTabChange('books')}
            >
              📚 Book Management
            </button>
            <button
              className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
              onClick={() => handleTabChange('requests')}
            >
              📋 Book Requests
            </button>
            <button
              className={`tab-btn ${activeTab === 'borrowers' ? 'active' : ''}`}
              onClick={() => handleTabChange('borrowers')}
            >
              👥 Borrower Statistics
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'books' && (
              <div className="admin-content">
                <div className="admin-section">
                  <h2>Add New Book</h2>
                  <BookForm addBook={addBook} />
                </div>

                <div className="admin-section">
                  <div className="section-header">
                    <h2>Book Collection</h2>
                    <SearchBar setSearch={setSearch} />
                  </div>
                  <BookList books={books} deleteBook={deleteBook} issueBook={issueBook} role="admin" />
                </div>
              </div>
            )}
            {activeTab === 'requests' && <AdminRequests key={refreshRequests} onUpdate={handleUpdate} />}
            {activeTab === 'borrowers' && <AdminBorrowers onReturn={handleUpdate} />}
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminPanel;
