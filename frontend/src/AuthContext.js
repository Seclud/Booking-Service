import React, { createContext, useContext, useEffect, useState } from 'react';
import {serverURL} from "./config";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

const fetchUserData = async (setIsAdmin) => {
  const token = localStorage.getItem('authToken');
  try {
    const response = await fetch(`${serverURL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    setIsAdmin(data.is_superuser);
  } catch (error) {
    console.error('Error fetching user data:', error);
  }
};

    
export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('authToken'));
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() =>{
      if (isAuthenticated) {
        fetchUserData(setIsAdmin);
      }
    },[isAuthenticated])

  const login = () => setIsAuthenticated(true);
  const logout = (callback) => {
    setIsAuthenticated(false);
    localStorage.removeItem('authToken'); 
    if (callback) callback();
  };



  return (
    <AuthContext.Provider value={{ isAuthenticated, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};