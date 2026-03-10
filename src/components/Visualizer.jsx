import { useRef } from 'react';
import { useStore } from '../store';
import { useVisualizer } from '../hooks/useVisualizer';

const VISUALIZERS = [
  { id: 'water',    label: 'Ambience : Water' },
  { id: 'bars',     label: 'Ambience : Bars' },
  { id: 'scope',    label: 'Ambience : Scope' },
  { id: 'alchemy',  label: 'Ambience : Alchemy' },
  { id: 'starfield',label: 'Ambience : Starfield' },
];

export default function Visualizer() {
  const canvasRef = useRef(null);
  const currentTrack = useStore((s) => s.currentTrack);
  const visualizer = useStore((s) => s.visualizer);
  const setVisualizer = useStore((s) => s.setVisualizer);
  const activeNav = useStore((s) => s.activeNav);
  const isActive = activeNav !== 'skin-chooser' && activeNav !== 'media-library';
  useVisualizer(canvasRef, isActive);

  if (!isActive) return null;

  const currentIndex = VISUALIZERS.findIndex((v) => v.id === visualizer);
  const currentLabel = VISUALIZERS[currentIndex]?.label ?? VISUALIZERS[0].label;

  const prev = () => {
    const idx = (currentIndex - 1 + VISUALIZERS.length) % VISUALIZERS.length;
    setVisualizer(VISUALIZERS[idx].id);
  };

  const next = () => {
    const idx = (currentIndex + 1) % VISUALIZERS.length;
    setVisualizer(VISUALIZERS[idx].id);
  };

  return (
    <div className="wmp-visualizer-area">
      {currentTrack && (
        <div className="wmp-track-header">
          <div className="wmp-track-artist">{currentTrack.artist}</div>
          <div className="wmp-track-title">
            <span className="wmp-track-title-inner">{currentTrack.name}</span>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="wmp-canvas" />
      <div className="wmp-viz-footer">
        <div className="wmp-viz-nav">
          <button className="wmp-viz-nav-btn" onClick={prev} title="Previous visualization">&#9664;</button>
          <button className="wmp-viz-nav-btn" onClick={next} title="Next visualization">&#9654;</button>
          <span className="wmp-viz-name">{currentLabel}</span>
        </div>
        {currentTrack && (
          <div className="wmp-album-strip">
            {currentTrack.albumArt && (
              <img src={currentTrack.albumArt} alt="" className="wmp-album-thumb" />
            )}
            <div className="wmp-album-strip-info">
              <div className="wmp-album-strip-artist">{currentTrack.artist.toUpperCase()}</div>
              <div className="wmp-album-strip-album">{currentTrack.album.toUpperCase()}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
