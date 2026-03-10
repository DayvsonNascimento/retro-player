import { useEffect, useCallback, useRef, useState } from 'react';
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
  const restoreAttemptedRef = useRef(false);

  const [isRestoring, setIsRestoring] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !!(
      localStorage.getItem('spotify_refresh_token') &&
      !localStorage.getItem('spotify_auth_code')
    );
  });

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
      setIsRestoring(false);
      return;
    }

    if (code) {
      handledRef.current = true;
      setIsRestoring(false);
      localStorage.removeItem('spotify_auth_code');
      exchangeCode(code)
        .then((data) =>
          setAuth(data.access_token, data.refresh_token, data.expires_in)
        )
        .catch((err) => console.error('Spotify token exchange failed:', err));
      return;
    }

    // No code from redirect: try to restore session from stored refresh token
    if (restoreAttemptedRef.current) return;
    const storedRefresh = localStorage.getItem('spotify_refresh_token');
    if (!storedRefresh) {
      setIsRestoring(false);
      return;
    }

    restoreAttemptedRef.current = true;
    setIsRestoring(true);
    refreshAccessToken(storedRefresh)
      .then((data) =>
        setAuth(
          data.access_token,
          data.refresh_token || storedRefresh,
          data.expires_in
        )
      )
      .catch(() => {
        clearAuth();
      })
      .finally(() => {
        setIsRestoring(false);
      });
  }, [isAuthenticated, setAuth, clearAuth]);

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

  return { isAuthenticated, login, logout: clearAuth, isRestoring };
}
