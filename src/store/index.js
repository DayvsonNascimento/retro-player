import { create } from 'zustand';

export const useStore = create((set, get) => ({
  accessToken: null,
  refreshToken: null,
  tokenExpiry: null,
  isAuthenticated: false,

  isPlaying: false,
  currentTrack: null,
  position: 0,
  duration: 0,
  volume: 80,
  shuffle: false,
  repeat: 'off',
  deviceId: null,
  player: null,

  tracks: [],
  playlistName: 'Sample Playlist',
  tracksLoading: false,

  searchResults: [],
  searchQuery: '',

  activeNav: 'now-playing',

  visualizer: 'water',
  theme: 'classic',

  setAuth: (accessToken, refreshToken, expiresIn) => {
    const tokenExpiry = Date.now() + expiresIn * 1000;
    try {
      localStorage.setItem('spotify_refresh_token', refreshToken);
      localStorage.setItem('spotify_token_expiry', String(tokenExpiry));
    } catch (_) {}
    set({ accessToken, refreshToken, tokenExpiry, isAuthenticated: true });
  },
  clearAuth: () => {
    try {
      localStorage.removeItem('spotify_refresh_token');
      localStorage.removeItem('spotify_token_expiry');
    } catch (_) {}
    set({
      accessToken: null,
      refreshToken: null,
      tokenExpiry: null,
      isAuthenticated: false,
      deviceId: null,
      player: null,
      currentTrack: null,
      isPlaying: false,
      tracks: [],
    });
  },
  setPlayer: (player) => set({ player }),
  setDeviceId: (deviceId) => set({ deviceId }),
  setCurrentTrack: (track) => set({ currentTrack: track }),
  setPlayState: (isPlaying) => set({ isPlaying }),
  setPosition: (position) => set({ position }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume }),
  setShuffle: (shuffle) => set({ shuffle }),
  setRepeat: (repeat) => set({ repeat }),
  setTracks: (tracks, playlistName) =>
    set({ tracks, playlistName: playlistName || get().playlistName }),
  setTracksLoading: (tracksLoading) => set({ tracksLoading }),
  setSearchResults: (searchResults) => set({ searchResults }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setActiveNav: (activeNav) => set({ activeNav }),
  setVisualizer: (visualizer) => set({ visualizer }),
  setTheme: (theme) => set({ theme }),
}));
