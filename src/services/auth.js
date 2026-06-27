export const signInWithGoogle = async () => {
  const { Platform } = require('react-native');
  
  // Web pe production URL use karo
  const redirectUrl = Platform.OS === 'web' 
    ? 'https://splitsaathi.com'
    : Linking.createURL('/auth/callback');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  });

  if (error) return { error };

  // Web pe browser automatically redirect karega
  if (Platform.OS === 'web') {
    return { data, error: null };
  }

  // Native pe WebBrowser use karo
  if (data?.url) {
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
    if (result.type === 'success') {
      const url     = result.url;
      const params  = new URLSearchParams(url.split('#')[1]);
      const access  = params.get('access_token');
      const refresh = params.get('refresh_token');
      if (access && refresh) {
        await supabase.auth.setSession({ access_token: access, refresh_token: refresh });
      }
    }
  }
  return { data, error: null };
};