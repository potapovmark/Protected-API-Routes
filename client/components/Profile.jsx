import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthProvider';
import { authClient } from '../api/authClient';

const Profile = () => {
  const { user, logout } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('idle'); // idle, requesting, verifying, success, error
  const [verificationMessage, setVerificationMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await authClient.getProfile();

        if (response.success) {
          setProfileData(response.data.user);
        } else {
          setError(response.error || 'Неизвестная ошибка');
        }
      } catch (err) {
        setError('Ошибка загрузки профиля: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const requestVerificationToken = async () => {
    const profile = profileData || user;
    if (!profile?.email) return;

    try {
      setVerificationStatus('requesting');
      setVerificationMessage('Запрос токена верификации...');

      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: profile.email }),
      });

      const result = await response.json();

      if (result.success) {
        setVerificationMessage('Токен получен! Нажмите кнопку подтверждения.');
        setVerificationStatus('ready');
        // Сохраняем токен для автоматической верификации
        if (result.data?.verificationToken) {
          window.verificationToken = result.data.verificationToken;
        }
      } else {
        setVerificationMessage(result.error);
        setVerificationStatus('error');
      }
    } catch (error) {
      setVerificationMessage('Ошибка при запросе токена верификации');
      setVerificationStatus('error');
    }
  };

  const verifyEmail = async () => {
    if (!window.verificationToken) {
      setVerificationMessage('Сначала получите токен верификации');
      setVerificationStatus('error');
      return;
    }

    try {
      setVerificationStatus('verifying');
      setVerificationMessage('Подтверждение email...');

      const response = await fetch(`/api/auth/verify-email?token=${window.verificationToken}`);
      const result = await response.json();

      if (result.success) {
        setVerificationMessage('Email успешно подтвержден!');
        setVerificationStatus('success');
        // Обновляем данные профиля
        const updatedProfile = { ...(profileData || user), isEmailVerified: true };
        setProfileData(updatedProfile);
        // Очищаем токен
        window.verificationToken = null;
      } else {
        setVerificationMessage(result.error);
        setVerificationStatus('error');
      }
    } catch (error) {
      setVerificationMessage('Ошибка при подтверждении email');
      setVerificationStatus('error');
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        fontSize: '18px'
      }}>
        Загрузка профиля...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px',
        backgroundColor: '#f8d7da',
        color: '#721c24',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <h3>Ошибка</h3>
        <p>{error}</p>
        <button
          onClick={logout}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Выйти
        </button>
      </div>
    );
  }

  const profile = profileData || user;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginTop: '20px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ color: '#495057', marginBottom: '10px' }}>
            Добро пожаловать, {profile.profile?.firstName || profile.username}!
          </h2>
          <p style={{ color: '#6c757d', margin: 0 }}>Ваша панель управления</p>
        </div>

        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ color: '#495057', marginBottom: '15px', borderBottom: '2px solid #e9ecef', paddingBottom: '10px' }}>
            Информация о профиле
          </h3>

          <div style={{ display: 'grid', gap: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <span style={{ fontWeight: 'bold', color: '#495057' }}>Email:</span>
              <span style={{ color: '#6c757d' }}>{profile.email}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <span style={{ fontWeight: 'bold', color: '#495057' }}>Имя пользователя:</span>
              <span style={{ color: '#6c757d' }}>{profile.username}</span>
            </div>

            {profile.profile?.firstName && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <span style={{ fontWeight: 'bold', color: '#495057' }}>Имя:</span>
                <span style={{ color: '#6c757d' }}>{profile.profile.firstName}</span>
              </div>
            )}

            {profile.profile?.lastName && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <span style={{ fontWeight: 'bold', color: '#495057' }}>Фамилия:</span>
                <span style={{ color: '#6c757d' }}>{profile.profile.lastName}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <span style={{ fontWeight: 'bold', color: '#495057' }}>Роль:</span>
              <span style={{
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold',
                backgroundColor: profile.role === 'admin' ? '#dc3545' : '#28a745',
                color: 'white'
              }}>
                {profile.role}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <span style={{ fontWeight: 'bold', color: '#495057' }}>Статус верификации:</span>
              <span style={{
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold',
                backgroundColor: profile.isEmailVerified ? '#28a745' : '#ffc107',
                color: profile.isEmailVerified ? 'white' : '#212529'
              }}>
                {profile.isEmailVerified ? 'Подтвержден' : 'Не подтвержден'}
              </span>
            </div>
          </div>
        </div>

        {!profile.isEmailVerified && (
          <div style={{ marginBottom: '25px' }}>
            <h3 style={{ color: '#495057', marginBottom: '15px', borderBottom: '2px solid #e9ecef', paddingBottom: '10px' }}>
              📧 Подтверждение Email
            </h3>

            <div style={{
              padding: '20px',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '8px',
              marginBottom: '15px'
            }}>

              {verificationStatus === 'idle' && (
                <button
                  onClick={requestVerificationToken}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  🔑 Получить токен верификации
                </button>
              )}

              {verificationStatus === 'requesting' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid #f3f3f3',
                    borderTop: '2px solid #007bff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  <span>{verificationMessage}</span>
                </div>
              )}

              {verificationStatus === 'ready' && (
                <div>
                  <p style={{ margin: '0 0 15px 0', color: '#856404' }}>
                    ✅ {verificationMessage}
                  </p>
                  <button
                    onClick={verifyEmail}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    ✅ Подтвердить Email
                  </button>
                </div>
              )}

              {verificationStatus === 'verifying' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid #f3f3f3',
                    borderTop: '2px solid #28a745',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  <span>{verificationMessage}</span>
                </div>
              )}

              {verificationStatus === 'success' && (
                <div style={{
                  padding: '15px',
                  backgroundColor: '#d4edda',
                  border: '1px solid #c3e6cb',
                  borderRadius: '4px',
                  color: '#155724'
                }}>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>
                    🎉 {verificationMessage}
                  </p>
                </div>
              )}

              {verificationStatus === 'error' && (
                <div>
                  <div style={{
                    padding: '15px',
                    backgroundColor: '#f8d7da',
                    border: '1px solid #f5c6cb',
                    borderRadius: '4px',
                    color: '#721c24',
                    marginBottom: '15px'
                  }}>
                    <p style={{ margin: 0 }}>❌ {verificationMessage}</p>
                  </div>
                  <button
                    onClick={requestVerificationToken}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    🔄 Попробовать снова
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {profile.profile?.bio && (
          <div style={{ marginBottom: '25px' }}>
            <h3 style={{ color: '#495057', marginBottom: '15px', borderBottom: '2px solid #e9ecef', paddingBottom: '10px' }}>
              О себе
            </h3>
            <p style={{
              padding: '15px',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              color: '#6c757d',
              lineHeight: '1.6'
            }}>
              {profile.profile.bio}
            </p>
          </div>
        )}

        <div style={{ textAlign: 'center', paddingTop: '20px', borderTop: '1px solid #e9ecef' }}>
          <button
            onClick={logout}
            style={{
              padding: '12px 24px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            Выйти из системы
          </button>
        </div>
      </div>

      {/* CSS анимация для спиннера */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Profile;
