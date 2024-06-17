// frontend/src/Navbar.js
import React from 'react';
import { Link, useNavigate  } from 'react-router-dom';
import { useAuth } from './AuthContext';

function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(() => navigate('/'));
  };

  return (
    <nav className="navbar">
      <ul>
        <li><Link to="/">Home</Link></li>
        {!isAuthenticated ? (
          <>
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/register">Register</Link></li>
          </>
        ) : (
          <>
            <li><Link to="/garages">Garages</Link></li>
            <li><Link to="/mybookings">MyBookings</Link></li>
            <li><button onClick={handleLogout}>Logout</button></li>
          </>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;