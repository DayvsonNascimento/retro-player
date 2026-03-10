import { useEffect, useCallback, useRef } from 'react';
import { useStore } from '../store';
import { startAuth, exchangeCode, refreshAccessToken } from '../utils/spotify';

export function useSpotifyAuth() {
  const setAuth = useStore((s) => s.setAuth);
  const clearAuth = useStore((s) => s.clearAuth);
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const refreshToken = useStore((s) => s.refreshToken);
  const tokenExpiry = useStore((s) => s.tokenExpiry);
  const refreshTimerRef = useRef(null);
  const handledRef = useRef(false);

  const login = useCallback(() => {
    startAuth();
  }, []);

  // On mount: check if we just came back from Spotify's redirect
  useEffect(() => {
    if (handledRef.current || isAuthenticated) return;

    const code = localStorage.getItem('spotify_auth_code');
    const error = localStorage.getItem('spotify_auth_error');

    if (error) {
      localStorage.removeItem('spotify_auth_error');
      console.error('Spotify auth error:', error);
      return;
    }

    if (code) {
      handledRef.current = true;
      localStorage.removeItem('spotify_auth_code');
      exchangeCode(code)
        .then((data) =>
          setAuth(data.access_token, data.refresh_token, data.expires_in)
        )
        .catch((err) => console.error('Spotify token exchange failed:', err));
    }
  }, [isAuthenticated, setAuth]);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!isAuthenticated || !refreshToken || !tokenExpiry) return;

    clearTimeout(refreshTimerRef.current);
    const refreshIn = tokenExpiry - Date.now() - 60_000;

    const doRefresh = async () => {
      try {
        const data = await refreshAccessToken(refreshToken);
        setAuth(
          data.access_token,
          data.refresh_token || refreshToken,
          data.expires_in
        );
      } catch {
        clearAuth();
      }
    };

    if (refreshIn <= 0) {
      doRefresh();
      return;
    }

    refreshTimerRef.current = setTimeout(doRefresh, refreshIn);
    return () => clearTimeout(refreshTimerRef.current);
  }, [isAuthenticated, refreshToken, tokenExpiry, setAuth, clearAuth]);

  return { isAuthenticated, login, logout: clearAuth };
}
