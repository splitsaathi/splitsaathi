import { supabase } from './supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export const signUp = async (email, password, name) => {
  const { data, error } = await supabase.auth.signUp({
    email, password, options: { data: { name } },
  });
  return { data, error };
};

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
};

export const signOut = async () => {
  await supabase.auth.signOut();
};

export const resetPassword = async (email) => {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'Splitsathi://reset-password',
  });
};

export const signInWithGoogle = async () => {
  const redirectUrl = Platform.OS === 'web'
    ? 'https://Splitsathi.com'
    : Linking.createURL('/auth/callback');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  });

  if (error) return { error };

  if (Platform.OS === 'web') {
    return { data, error: null };
  }

  if (data?.url) {
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
    if (result.type === 'success') {
      const url = result.url;
      const params = new URLSearchParams(url.split('#')[1]);
      const access = params.get('access_token');
      const refresh = params.get('refresh_token');
      if (access && refresh) {
        await supabase.auth.setSession({ access_token: access, refresh_token: refresh });
      }
    }
  }
  return { data, error: null };
};

export const sendOTP = async (phone) => {
  return supabase.auth.signInWithOtp({ phone });
};

export const verifyOTP = async (phone, token) => {
  return supabase.auth.verifyOtp({ phone, token, type: 'sms' });
};

export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

export const onAuthStateChange = (callback) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return subscription;
};

