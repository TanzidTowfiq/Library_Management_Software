import axios from 'axios';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css';

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      await axios.post('http://localhost:5000/api/register', {
        username,
        password,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <div className="logo-icon">📝</div>
          <h1>Student Registration</h1>
          <p className="subtitle">Create your student account</p>
        </div>

        <form onSubmit={handleRegister} className="register-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input id="username" type="text" placeholder="Choose a username" value={username} required onChange={(e) => setUsername(e.target.value)} />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" placeholder="Create a password" value={password} required onChange={(e) => setPassword(e.target.value)} />
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">Registration successful! Redirecting to login...</div>}

          <button type="submit" className="btn-primary register-btn" disabled={loading}>
            {loading ? 'Registering...' : 'Create Account'}
          </button>
        </form>

        <div className="back-link">
          <button type="button" className="btn-outline" onClick={() => navigate('/')}>
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default Register;
