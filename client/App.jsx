import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthProvider';
import LoginForm from './components/LoginForm';
import RegistrationForm from './components/RegistrationForm';
import EmailVerification from './components/EmailVerification';
import LogoutButton from './components/LogoutButton';
import ProtectedRoute from './components/ProtectedRoute';
import Profile from './components/Profile';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('login');

  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/register') setCurrentPage('register');
    else if (path === '/verify') setCurrentPage('verify');
    else if (path === '/profile') setCurrentPage('profile');
    else setCurrentPage('login');
  }, []);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.history.pushState({}, '', `/${page}`);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        Загрузка...
      </div>
    );
  }

  const renderNavigation = () => (
    <nav style={{
      backgroundColor: '#f8f9fa',
      padding: '10px',
      marginBottom: '20px',
      borderBottom: '1px solid #dee2e6'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, color: '#495057' }}>JWT Аутентификация</h1>
        <div>
          {user ? (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span>Привет, {user.profile?.firstName || user.username}!</span>
              <button
                onClick={() => handlePageChange('profile')}
                style={{ padding: '5px 10px', marginRight: '10px' }}
              >
                Профиль
              </button>
              <LogoutButton onLogout={() => handlePageChange('login')} />
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => handlePageChange('login')}
                style={{ padding: '5px 10px' }}
              >
                Вход
              </button>
              <button
                onClick={() => handlePageChange('register')}
                style={{ padding: '5px 10px' }}
              >
                Регистрация
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );

  const renderContent = () => {
    switch (currentPage) {
      case 'register':
        return <RegistrationForm onSuccess={() => handlePageChange('login')} />;
      case 'verify':
        return <EmailVerification />;
      case 'profile':
        return (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        );
      default:
        return <LoginForm onSuccess={() => handlePageChange('profile')} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {renderNavigation()}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        {renderContent()}
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
