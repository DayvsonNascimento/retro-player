import { useStore } from '../store';
import { useSpotifyAuth } from '../hooks/useSpotifyAuth';
import SpotifySearch from './SpotifySearch';
import SkinChooser from './SkinChooser';

export default function NowPlaying() {
  const { isAuthenticated, login, logout, isRestoring } = useSpotifyAuth();
  const activeNav = useStore((s) => s.activeNav);
  const deviceId = useStore((s) => s.deviceId);

  if (isRestoring) {
    return (
      <div className="wmp-connect-overlay">
        <span className="wmp-restoring-text">Restoring session…</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="wmp-connect-overlay">
        <svg viewBox="0 0 48 48" width="40" height="40">
          <circle cx="24" cy="24" r="24" fill="#1DB954" />
          <path
            d="M34.8 21.8c-5.8-3.4-15.4-3.7-20.9-2.1-.9.3-1.8-.2-2.1-1.1-.3-.9.2-1.8 1.1-2.1 6.3-1.9 16.8-1.5 23.4 2.4.8.5 1.1 1.5.6 2.3-.5.7-1.5 1-2.1.6zm-.4 4.9c-.4.6-1.2.9-1.8.4-4.8-3-12.2-3.8-17.9-2.1-.7.2-1.5-.2-1.7-.9-.2-.7.2-1.5.9-1.7 6.5-2 14.6-1 20.1 2.4.6.4.8 1.3.4 1.9zm-2.1 4.7c-.3.5-1 .7-1.5.4-4.2-2.6-9.5-3.1-15.7-1.7-.6.1-1.2-.2-1.3-.8-.1-.6.2-1.2.8-1.3 6.8-1.6 12.7-0.9 17.3 2 .5.2.7 1 .4 1.4z"
            fill="white"
          />
        </svg>
        <button className="wmp-btn-spotify" onClick={login}>
          Connect to Spotify
        </button>
      </div>
    );
  }

  if (activeNav === 'media-library') {
    return (
      <div className="wmp-now-playing-bar" style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <SpotifySearch />
      </div>
    );
  }

  if (activeNav === 'skin-chooser') {
    return (
      <div className="wmp-now-playing-bar" style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <SkinChooser />
      </div>
    );
  }

  return (
    <div className="wmp-now-playing-bar">
      {!deviceId && (
        <div className="wmp-device-status">
          Initializing player...
        </div>
      )}
      {deviceId && (
        <div className="wmp-device-status ready">
          <span>&#9679; Spotify connected</span>
          <button className="wmp-btn-sm-action" onClick={logout}>
            Disconnect
          </button>
          <button
            className="wmp-btn-sm-action"
            onClick={() => useStore.getState().setActiveNav('media-library')}
          >
            Search Music
          </button>
        </div>
      )}
    </div>
  );
}
