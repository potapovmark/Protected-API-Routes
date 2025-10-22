import React from 'react';
import { useAuth } from '../context/AuthProvider';

const ProtectedRoute = ({ children, requiredRole, fallback }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return fallback || <div>Authentication required</div>;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <div>Insufficient permissions</div>;
  }

  return children;
};

export default ProtectedRoute;
