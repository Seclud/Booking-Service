import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Navbar from './Navbar';

function LoginPage() {
  const [username, setName] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const { login } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
      };
      const body = new URLSearchParams();
      body.append('username', username);
      body.append('password', password);
  
      const response = await fetch('http://localhost:8000/login/access-token', {
        method: 'POST',
        headers: headers,
        body: body,
      });
  

      if (!response.ok) {
        throw new Error('Login failed');
      }
      const data = await response.json();
      console.log('Login successful', data);
      // Store the token, redirect user or show success message
      localStorage.setItem('authToken', data.access_token);
      login();
      navigate('/');
    } catch (error) {
      // Show error message to the user
      console.error('Login error:', error);
      setErrorMessage('Login failed. Please check your credentials.');
    }
  };

  return (
    <div>
      <Navbar />
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input type="text" value={username} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label>Password:</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {errorMessage && <div style={{color: 'red'}}>{errorMessage}</div>}
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default LoginPage;