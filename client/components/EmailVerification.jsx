import React, { useState, useEffect } from 'react';

const EmailVerification = () => {
  const [status, setStatus] = useState('waiting');
  const [message, setMessage] = useState('');
  const [verificationToken, setVerificationToken] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
      setVerificationToken(token);
      setStatus('verifying');
      verifyEmail(token);
    }
  }, []);

  const verifyEmail = async (token) => {
    try {
      const response = await fetch(`/api/auth/verify-email?token=${token}`);
      const result = await response.json();

      if (result.success) {
        setStatus('success');
        setMessage('Email verified successfully! You can now log in.');
      } else {
        setStatus('error');
        setMessage(result.error);
      }
    } catch (error) {
      setStatus('error');
      setMessage('Verification failed. Please try again.');
    }
  };

  const resendVerification = async () => {
    const email = prompt('Enter your email address:');
    if (!email) return;

    try {
      setStatus('sending');
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage('Verification token generated!');
        setStatus('token_ready');

        if (result.data && result.data.verificationToken) {
          setVerificationToken(result.data.verificationToken);
        }
      } else {
        setMessage(result.error);
        setStatus('error');
      }
    } catch (error) {
      setMessage('Failed to resend verification email.');
      setStatus('error');
    }
  };

  const autoVerify = async () => {
    if (!verificationToken) return;

    try {
      setStatus('verifying');
      const response = await fetch(`/api/auth/verify-email?token=${verificationToken}`);
      const result = await response.json();

      if (result.success) {
        setStatus('success');
        setMessage('Email verified successfully! You can now log in.');
      } else {
        setStatus('error');
        setMessage(result.error);
      }
    } catch (error) {
      setStatus('error');
      setMessage('Verification failed. Please try again.');
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', textAlign: 'center' }}>
      <h2>Email Verification</h2>


      {status === 'waiting' && (
        <div style={{
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <h3>Get verification token</h3>
          <p>Enter your email to get verification token:</p>
          <button
            onClick={resendVerification}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Get Token
          </button>
        </div>
      )}

      {status === 'sending' && (
        <div style={{
          padding: '20px',
          backgroundColor: '#fff3cd',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <p>Sending request...</p>
        </div>
      )}

      {status === 'token_ready' && (
        <div style={{
          padding: '20px',
          backgroundColor: '#d1ecf1',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <h3>Token ready!</h3>
          <p>Click the button below to automatically verify email:</p>
          <button
            onClick={autoVerify}
            style={{
              padding: '12px 24px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
              marginTop: '10px'
            }}
          >
            ✅ Verify Email
          </button>
        </div>
      )}

      {status === 'verifying' && (
        <div style={{
          padding: '20px',
          backgroundColor: '#fff3cd',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <h3>Verifying...</h3>
          <p>Verifying your email...</p>
          <div style={{ marginTop: '20px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #007bff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }}></div>
          </div>
        </div>
      )}

      {status === 'success' && (
        <div style={{
          padding: '20px',
          backgroundColor: '#d4edda',
          color: '#155724',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <h3>✅ Success!</h3>
          <p>{message}</p>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '15px',
              fontSize: '16px'
            }}
          >
             Back to login
          </button>
        </div>
      )}

      {status === 'error' && (
        <div style={{
          padding: '20px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px',
          marginTop: '20px'
        }}>
          <h3> Error </h3>
          <p>{message}</p>
          <button
            onClick={resendVerification}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Try again
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default EmailVerification;
