
import React, {
  createContext,
  useContext,
  useState,
} from 'react';

import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(api.getToken());

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');

    if (!savedUser) {
      return null;
    }

    try {
      return JSON.parse(savedUser);
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);

    try {
      const response = await api.login(email, password);

      if (!response?.access_token) {
        throw new Error('Token not received from server');
      }

      api.setToken(response.access_token);
      setToken(response.access_token);

      // Get the real user information from the backend.
      const userInfo = await api.getCurrentUser();

      localStorage.setItem(
        'user',
        JSON.stringify(userInfo)
      );

      setUser(userInfo);

      return {
        success: true,
        user: userInfo,
      };
    } catch (err) {
      api.setToken(null);
      setToken(null);
      setUser(null);
      localStorage.removeItem('user');

      return {
        success: false,
        error: err.message,
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    username,
    email,
    password
  ) => {
    setLoading(true);

    try {
      await api.register(
        username,
        email,
        password
      );

      return {
        success: true,
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    api.setToken(null);
    localStorage.removeItem('user');

    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () =>
  useContext(AuthContext);
