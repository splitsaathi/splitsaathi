// src/hooks/useAuth.js
import { useEffect } from 'react';
import { useAuthStore } from '../store';
import { onAuthStateChange } from '../services/auth';
import { getProfile } from '../services/database';
import { registerForPushNotifications } from '../services/notifications';

export function useAuth() {
  const { user, profile, loading, setUser, setProfile, setLoading, clear } = useAuthStore();

  useEffect(() => {
    const sub = onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        const { data: p } = await getProfile(session.user.id);
        setProfile(p);
        await registerForPushNotifications(session.user.id);
      } else {
        clear();
      }
    });
    return () => sub?.unsubscribe?.();
  }, []);

  return { user, profile, loading };
}

