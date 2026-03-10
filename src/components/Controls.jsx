import { useStore } from '../store';
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer';
import { setPlayerShuffle, setPlayerRepeat } from '../utils/spotify';

function formatMs(ms) {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export default function Controls() {
  const { togglePlay, nextTrack, previousTrack, seek, setVolume } =
    useSpotifyPlayer();
  const isPlaying = useStore((s) => s.isPlaying);
  const position = useStore((s) => s.position);
  const currentTrack = useStore((s) => s.currentTrack);
  const volume = useStore((s) => s.volume);
  const shuffle = useStore((s) => s.shuffle);
  const repeat = useStore((s) => s.repeat);
  const accessToken = useStore((s) => s.accessToken);
  const setShuffle = useStore((s) => s.setShuffle);
  const setRepeat = useStore((s) => s.setRepeat);

  const duration = currentTrack?.duration || 0;
  const progress = duration ? (position / duration) * 100 : 0;

  const handleSeek = (e) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(Math.floor(pct * duration));
  };

  const handleVolume = (e) => {
    setVolume(Number(e.target.value));
  };

  const handleStop = async () => {
    const player = useStore.getState().player;
    if (player) {
      await player.pause();
      seek(0);
    }
  };

  const handleShuffle = async () => {
    const next = !shuffle;
    setShuffle(next);
    if (accessToken) {
      try {
        await setPlayerShuffle(next, accessToken);
      } catch {}
    }
  };

  const handleRepeat = async () => {
    const states = ['off', 'context', 'track'];
    const idx = states.indexOf(repeat);
    const next = states[(idx + 1) % states.length];
    setRepeat(next);
    if (accessToken) {
      try {
        await setPlayerRepeat(next, accessToken);
      } catch {}
    }
  };

  return (
    <div className="wmp-controls">
      <div className="wmp-status-bar">
        <div className="wmp-status-left">
          <span className="wmp-status-icon">{isPlaying ? '▶' : '■'}</span>
          {currentTrack && (
            <span className="wmp-status-track">
              {currentTrack.name} &mdash; {currentTrack.artist}
            </span>
          )}
        </div>
        <div className="wmp-status-right">
          <span>{formatMs(position)}</span>
        </div>
      </div>

      <div className="wmp-seek-bar" onClick={handleSeek}>
        <div className="wmp-seek-fill" style={{ width: `${progress}%` }} />
        <div
          className="wmp-seek-thumb"
          style={{ left: `${progress}%` }}
        />
      </div>

      <div className="wmp-transport">
        <div className="wmp-transport-left">
          <div className="wmp-logo-area">
            <svg viewBox="0 0 24 24" width="28" height="28">
              <circle cx="12" cy="12" r="11" fill="#F47920" />
              <polygon points="9,6 19,12 9,18" fill="#fff" />
            </svg>
            <span className="wmp-logo-text">Windows<br/>Media Player</span>
          </div>
        </div>

        <div className="wmp-transport-center">
          <button
            className="wmp-btn-transport"
            onClick={togglePlay}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button
            className="wmp-btn-transport wmp-btn-sm"
            onClick={handleStop}
            title="Stop"
          >
            ■
          </button>
          <button
            className="wmp-btn-transport wmp-btn-sm"
            onClick={previousTrack}
            title="Previous"
          >
            ⏮
          </button>
          <button
            className="wmp-btn-transport wmp-btn-sm"
            onClick={nextTrack}
            title="Next"
          >
            ⏭
          </button>
          <div className="wmp-transport-divider" />
          <button
            className={`wmp-btn-transport wmp-btn-sm ${shuffle ? 'active' : ''}`}
            onClick={handleShuffle}
            title="Shuffle"
          >
            🔀
          </button>
          <button
            className={`wmp-btn-transport wmp-btn-sm ${repeat !== 'off' ? 'active' : ''}`}
            onClick={handleRepeat}
            title={`Repeat: ${repeat}`}
          >
            🔁
          </button>
        </div>

        <div className="wmp-transport-right">
          <span className="wmp-volume-icon">🔊</span>
          <input
            type="range"
            className="wmp-volume-slider"
            min="0"
            max="100"
            value={volume}
            onChange={handleVolume}
            title={`Volume: ${volume}%`}
          />
          {currentTrack && (
            <span className="wmp-total-time">
              Total Time: {formatMs(duration)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
