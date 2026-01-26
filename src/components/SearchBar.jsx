import './SearchBar.css';

function SearchBar({ setSearch }) {
  return (
    <div className="search-bar">
      <span className="search-icon">🔍</span>
      <input type="text" placeholder="Search by title or author..." onChange={(e) => setSearch(e.target.value)} className="search-input" />
    </div>
  );
}

export default SearchBar;
