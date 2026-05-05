/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { User } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('restpro_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (name: string, tableId: string, subcomandaId: string) => {
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      role: 'customer',
      tableId,
      subcomandaId
    };
    setUser(newUser);
    localStorage.setItem('restpro_user', JSON.stringify(newUser));
  };

  const adminLogin = (name: string) => {
    const newUser: User = {
      id: 'admin-root',
      name,
      role: 'admin'
    };
    setUser(newUser);
    localStorage.setItem('restpro_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('restpro_user');
  };

  return { user, login, adminLogin, logout };
}
