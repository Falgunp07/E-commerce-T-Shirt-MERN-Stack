import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);
const API_URL = 'http://localhost:5000/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setUser(null);
      return null;
    }

    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Unable to load account');
    setUser(data.user);
    return data.user;
  }

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setLoading(false);
      return;
    }

    refreshUser()
      .catch(() => {
        localStorage.removeItem('authToken');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function authenticate(path, credentials) {
    const response = await fetch(`${API_URL}/auth/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Unable to continue');

    localStorage.setItem('authToken', data.token);
    setUser(data.user);
    return data.user;
  }

  function login(credentials) {
    return authenticate('login', credentials);
  }

  function register(credentials) {
    return authenticate('register', credentials);
  }

  function logout() {
    localStorage.removeItem('authToken');
    setUser(null);
  }

  async function updateProfile(profile) {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profile),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Unable to update profile');
    setUser(data.user);
    return data.user;
  }

  async function changePassword(payload) {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/auth/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Unable to update password');
    return data;
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, updateProfile, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
