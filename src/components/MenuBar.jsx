import { useState, useEffect, useRef } from 'react';
import { useSpotifyAuth } from '../hooks/useSpotifyAuth';

export default function MenuBar() {
  const [openMenu, setOpenMenu] = useState(null);
  const menuBarRef = useRef(null);
  const { isAuthenticated, logout } = useSpotifyAuth();

  useEffect(() => {
    if (!openMenu) return;
    const handleOutside = (e) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [openMenu]);

  const toggle = (name) => setOpenMenu((prev) => (prev === name ? null : name));
  const close = () => setOpenMenu(null);

  const handleDisconnect = () => {
    logout();
    close();
  };

  return (
    <div className="wmp-menubar" ref={menuBarRef}>
      {/* File menu */}
      <span
        className={`wmp-menu-item${openMenu === 'file' ? ' open' : ''}`}
        onMouseDown={(e) => { e.stopPropagation(); toggle('file'); }}
      >
        File
        {openMenu === 'file' && (
          <div className="wmp-menu-dropdown" onMouseDown={(e) => e.stopPropagation()}>
            {isAuthenticated && (
              <button className="wmp-menu-dropdown-item" onClick={handleDisconnect}>
                Disconnect from Spotify
              </button>
            )}
            {!isAuthenticated && (
              <button className="wmp-menu-dropdown-item" disabled>
                Not connected
              </button>
            )}
            <div className="wmp-menu-separator" />
            <button className="wmp-menu-dropdown-item" onClick={close}>
              Close
            </button>
          </div>
        )}
      </span>

      <span className="wmp-menu-item" onMouseDown={(e) => e.stopPropagation()}>View</span>
      <span className="wmp-menu-item" onMouseDown={(e) => e.stopPropagation()}>Play</span>
      <span className="wmp-menu-item" onMouseDown={(e) => e.stopPropagation()}>Tools</span>
      <span className="wmp-menu-item" onMouseDown={(e) => e.stopPropagation()}>Help</span>
    </div>
  );
}
