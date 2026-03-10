import { useState, useRef, useCallback } from 'react';
import TitleBar from './components/TitleBar';
import MenuBar from './components/MenuBar';
import NavPanel from './components/NavPanel';
import Visualizer from './components/Visualizer';
import NowPlaying from './components/NowPlaying';
import Playlist from './components/Playlist';
import Controls from './components/Controls';
import { useWindowManager } from './hooks/useWindowManager';
import { useMediaQuery } from './hooks/useMediaQuery';
import { useStore } from './store';

const RESIZE_DIRECTIONS = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
const PLAYLIST_MIN = 140;
const PLAYLIST_MAX = 420;
const PLAYLIST_DEFAULT = 220;
const MOBILE_BREAKPOINT = '(max-width: 768px)';

export default function App() {
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT);
  const { state, startDrag, startResize, toggleMaximize, toggleMinimize } =
    useWindowManager();
  const theme = useStore((s) => s.theme);

  const [playlistWidth, setPlaylistWidth] = useState(PLAYLIST_DEFAULT);
  const playlistWidthRef = useRef(playlistWidth);
  playlistWidthRef.current = playlistWidth;

  const noop = useCallback(() => {}, []);

  const startPlaylistResize = useCallback((e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const origWidth = playlistWidthRef.current;

    const onMove = (me) => {
      const delta = startX - me.clientX;
      const next = Math.max(PLAYLIST_MIN, Math.min(PLAYLIST_MAX, origWidth + delta));
      setPlaylistWidth(next);
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, []);

  const windowStyle = isMobile
    ? {
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100dvh',
        minHeight: 0,
      }
    : {
        position: 'fixed',
        left: state.x,
        top: state.y,
        width: state.width,
        height: state.isMinimized ? 'auto' : state.height,
        minHeight: state.isMinimized ? 0 : undefined,
      };

  return (
    <div
      className={`wmp-window${state.isMaximized && !isMobile ? ' maximized' : ''}${isMobile ? ' wmp-mobile' : ''}`}
      data-theme={theme}
      style={windowStyle}
    >
      {!isMobile &&
        RESIZE_DIRECTIONS.map((dir) => (
          <div
            key={dir}
            className={`wmp-resize-handle wmp-resize-${dir}`}
            onMouseDown={(e) => !state.isMaximized && startResize(e, dir)}
          />
        ))}

      <TitleBar
        onDragStart={isMobile ? noop : startDrag}
        onMaximize={isMobile ? noop : toggleMaximize}
        onMinimize={isMobile ? noop : toggleMinimize}
        isMaximized={state.isMaximized}
      />
      <MenuBar />

      {(!state.isMinimized || isMobile) && (
        <>
          <div className="wmp-main">
            <NavPanel />
            <div className="wmp-center">
              <Visualizer />
              <NowPlaying />
            </div>
            {!isMobile && (
              <div
                className="wmp-playlist-resize-handle"
                onMouseDown={startPlaylistResize}
              />
            )}
            <Playlist
              style={{
                width: isMobile ? undefined : playlistWidth,
              }}
            />
          </div>
          <Controls />
        </>
      )}
    </div>
  );
}
