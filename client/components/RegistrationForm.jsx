import React, { useState } from 'react';

const RegistrationForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    firstName: '',
    lastName: '',
    bio: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const requestData = {
        email: formData.email,
        password: formData.password,
        username: formData.username,
        profile: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          bio: formData.bio || ''
        }
      };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (result.success) {
        setMessage('Регистрация успешна! Проверьте вашу почту для подтверждения.');
        setFormData({
          email: '',
          password: '',
          username: '',
          firstName: '',
          lastName: '',
          bio: ''
        });
        setTimeout(() => {
          onSuccess && onSuccess();
        }, 2000);
      } else {
        let errorMessage = result.error;

        // Улучшаем сообщения об ошибках
        if (errorMessage.includes('password') && errorMessage.includes('fails to match')) {
          errorMessage = 'Пароль не соответствует требованиям безопасности. Используйте заглавные и строчные буквы, цифры и специальные символы.';
        } else if (errorMessage.includes('already exists')) {
          errorMessage = 'Пользователь с таким email или именем уже существует.';
        } else if (errorMessage.includes('email')) {
          errorMessage = 'Некорректный формат email.';
        }

        setMessage(`Ошибка: ${errorMessage}`);
      }
    } catch (error) {
      setMessage('Ошибка регистрации. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ textAlign: 'center', color: '#495057', marginBottom: '30px' }}>Регистрация пользователя</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#495057' }}>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '12px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '16px' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#495057' }}>Пароль:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '12px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '16px' }}
          />
          <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '5px' }}>
            Пароль должен содержать: минимум 8 символов, заглавные и строчные буквы, цифры и специальные символы (@$!%*?&)
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#495057' }}>Имя пользователя:</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '12px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '16px' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#495057' }}>Имя:</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '12px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '16px' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#495057' }}>Фамилия:</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '12px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '16px' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#495057' }}>О себе:</label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows="3"
            style={{ width: '100%', padding: '12px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '16px' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: loading ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {loading ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>
      </form>

      {message && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          backgroundColor: message.includes('Error') ? '#f8d7da' : '#d4edda',
          color: message.includes('Error') ? '#721c24' : '#155724',
          borderRadius: '4px'
        }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default RegistrationForm;


