import axios from 'axios';
import { useEffect, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';

import AdminPanel from './components/AdminPanel';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Register from './components/Register';
import StudentPanel from './components/StudentPanel';

function App() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  // Fetch books from backend
  const fetchBooks = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/books');
      setBooks(res.data);
    } catch (err) {
      console.log('Error fetching books:', err);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  // Add book
  const addBook = async (book) => {
    try {
      await axios.post('http://localhost:5000/api/books', book);
      fetchBooks();
    } catch (err) {
      console.log(err);
    }
  };

  // Delete book
  const deleteBook = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/books/${id}`);
      fetchBooks();
    } catch (err) {
      console.log(err);
    }
  };

  // Issue / Return book
  const issueBook = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/books/issue/${id}`);
      fetchBooks();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <Routes>
      {/* Login page */}
      <Route path="/" element={<Login fetchBooks={fetchBooks} />} />

      {/* Student registration page */}
      <Route path="/register" element={<Register />} />

      {/* Admin panel */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminPanel
              books={books.filter((b) => b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase()))}
              addBook={addBook}
              deleteBook={deleteBook}
              issueBook={issueBook}
              setSearch={setSearch}
              fetchBooks={fetchBooks}
            />
          </ProtectedRoute>
        }
      />

      {/* Student panel */}
      <Route
        path="/student"
        element={
          <ProtectedRoute role="student">
            <StudentPanel
              books={books.filter((b) => b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase()))}
              setSearch={setSearch}
              onRequestBook={fetchBooks}
              onToggleFavorite={fetchBooks}
            />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
