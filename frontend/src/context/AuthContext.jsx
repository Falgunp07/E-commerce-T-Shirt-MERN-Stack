import { createContext, useContext, useEffect, useState } from 'react';
import { API_BASE_URL } from '../config/api';

const AuthContext = createContext(null);
const API_URL = `${API_BASE_URL}/api`;

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
    if (['admin', 'catalog_manager', 'logistics_manager'].includes(data.user?.role)) {
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUser', JSON.stringify(data.user));
    }
    setUser(data.user);
    return data.user;
  }

  async function syncClerkUser({ clerkId, email, name, avatar }) {
    const response = await fetch(`${API_URL}/auth/clerk-sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clerkId, email, name, avatar }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Unable to sync Clerk user');

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
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setUser(null);
    if (typeof window !== 'undefined' && window.Clerk && typeof window.Clerk.signOut === 'function') {
      window.Clerk.signOut().catch(() => {});
    }
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
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, updateProfile, changePassword, syncClerkUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
