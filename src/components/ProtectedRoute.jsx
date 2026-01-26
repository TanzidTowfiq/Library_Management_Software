import { Navigate } from 'react-router-dom';

function ProtectedRoute({ role, children }) {
  const userRole = localStorage.getItem('role');
  if (userRole !== role) {
    return <Navigate to="/" />;
  }
  return children;
}

export default ProtectedRoute;
