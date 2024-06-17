import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('authToken') ? true : false);

  const login = () => setIsAuthenticated(true);
  const logout = (callback) => {
    setIsAuthenticated(false);
    localStorage.removeItem('authToken'); 
    if (callback) callback();
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};