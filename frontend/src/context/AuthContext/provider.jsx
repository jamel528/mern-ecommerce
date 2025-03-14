import { useState, useEffect } from 'react';
import AuthContext from './context.jsx';
import api from '../../config/axios';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Try to get the user data from sessionStorage on initial load
    const savedUser = sessionStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Update sessionStorage whenever user state changes
  useEffect(() => {
    if (user) {
      sessionStorage.setItem('user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('user');
    }
  }, [user]);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });
      
      const userData = {
        ...response.data.user,
        token: response.data.token,
      };
      
      setUser(userData);
      return userData;
    } catch (error) {
      throw error.message || 'Login failed';
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error.message || 'Registration failed';
    }
  };

  const updateUser = async (userData) => {
    try {
      const response = await api.put('/auth/me', userData);
      const updatedUser = {
        ...user,
        ...response.data,
      };
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      throw error.message || 'Failed to update profile';
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        register,
        updateUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
