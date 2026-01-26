import { useState } from "react";
import './BookForm.css';

function BookForm({ addBook }) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addBook({ title, author });
      setTitle("");
      setAuthor("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="book-form">
      <div className="form-group">
        <label htmlFor="book-title">Book Title</label>
        <input
          id="book-title"
          type="text"
          placeholder="Enter book title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="book-author">Author Name</label>
        <input
          id="book-author"
          type="text"
          placeholder="Enter author name"
          value={author}
          onChange={e => setAuthor(e.target.value)}
          required
        />
      </div>
      
      <button type="submit" className="btn-primary add-book-btn" disabled={loading}>
        {loading ? 'Adding...' : '➕ Add Book'}
      </button>
    </form>
  );
}

export default BookForm;
