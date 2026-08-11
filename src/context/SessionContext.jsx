import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getMe, superAdminLogin, waitersClient, cooksClient, adminsClient } from '../api/client';

const SessionContext = createContext(null);

async function loginWithPin(client, userId, pin) {
  const data = await client.login(userId, pin);
  localStorage.setItem('staffToken', data.token);
  return data.user;
}

export function SessionProvider({ children }) {
  const [session, setSession] = useState(null); // { id, name, role } | null
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('staffToken');
    if (!token) {
      setLoading(false);
      return;
    }

    getMe()
      .then((data) => {
        if (data.authenticated) setSession(data.user);
        else localStorage.removeItem('staffToken');
      })
      .catch(() => localStorage.removeItem('staffToken'))
      .finally(() => setLoading(false));
  }, []);

  const loginWaiter = useCallback(async (userId, pin) => {
    const user = await loginWithPin(waitersClient, userId, pin);
    setSession(user);
    return user;
  }, []);

  const loginCook = useCallback(async (userId, pin) => {
    const user = await loginWithPin(cooksClient, userId, pin);
    setSession(user);
    return user;
  }, []);

  const loginAdmin = useCallback(async (userId, pin) => {
    const user = await loginWithPin(adminsClient, userId, pin);
    setSession(user);
    return user;
  }, []);

  const loginSuperAdmin = useCallback(async (email, password) => {
    const data = await superAdminLogin(email, password);
    localStorage.setItem('staffToken', data.token);
    setSession(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('staffToken');
    setSession(null);
  }, []);

  return (
    <SessionContext.Provider
      value={{ session, loading, loginWaiter, loginCook, loginAdmin, loginSuperAdmin, logout }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession debe usarse dentro de SessionProvider');
  return ctx;
}
