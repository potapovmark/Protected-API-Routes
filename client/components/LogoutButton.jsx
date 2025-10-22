import React, { useState } from 'react';
import { useAuth } from '../context/AuthProvider';

const LogoutButton = ({ onLogout }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { logout } = useAuth();

  const handleLogout = async () => {
    setIsLoading(true);
    await logout();
    setIsLoading(false);
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      style={{
        padding: '8px 16px',
        backgroundColor: '#dc3545',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        fontSize: '14px'
      }}
    >
      {isLoading ? 'Logging out...' : 'Logout'}
    </button>
  );
};

export default LogoutButton;
