import axios from 'axios';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login({ fetchBooks }) {
  const [role, setRole] = useState('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/login', {
        username,
        password,
      });

      localStorage.setItem('role', res.data.role);
      localStorage.setItem('username', res.data.username);

      await fetchBooks();

      if (res.data.role === 'admin') navigate('/admin');
      else navigate('/student');
    } catch (err) {
      setError('Invalid login credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-icon">📚</div>
          <h1>Library Management System</h1>
          <p className="subtitle">Sign in to access your account</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="role">Login As</label>
            <select id="role" value={role} onChange={(e) => setRole(e.target.value)} className="role-select">
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input id="username" type="text" placeholder="Enter your username" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn-primary login-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {role === 'student' && (
          <div className="register-link">
            <p>Don't have an account?</p>
            <button type="button" className="btn-outline" onClick={() => navigate('/register')}>
              Register New Account
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
