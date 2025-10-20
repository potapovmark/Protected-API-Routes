import React from 'react';
import { useAuth } from '../context/AuthProvider';

const ProtectedRoute = ({ children, requiredRole, fallback }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <div>Загрузка...</div>;
  }

  if (!isAuthenticated) {
    return fallback || <div>Необходима авторизация</div>;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <div>Недостаточно прав доступа</div>;
  }

  return children;
};

export default ProtectedRoute;
