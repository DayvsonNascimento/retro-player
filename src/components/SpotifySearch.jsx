import { useState, useRef } from 'react';
import { useStore } from '../store';
import { searchTracks, playTrack } from '../utils/spotify';

function formatMs(ms) {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export default function SpotifySearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const accessToken = useStore((s) => s.accessToken);
  const deviceId = useStore((s) => s.deviceId);
  const setActiveNav = useStore((s) => s.setActiveNav);
  const debounceRef = useRef(null);

  const handleSearch = (value) => {
    setQuery(value);
    clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      if (!accessToken) return;
      setLoading(true);
      try {
        const data = await searchTracks(value, accessToken);
        setResults(
          (data.tracks?.items || []).map((t) => ({
            id: t.id,
            uri: t.uri,
            name: t.name,
            artist: t.artists.map((a) => a.name).join(', '),
            album: t.album.name,
            albumArt: t.album.images[t.album.images.length - 1]?.url,
            duration: t.duration_ms,
          }))
        );
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  const handlePlay = async (track) => {
    if (!deviceId || !accessToken) return;
    try {
      await playTrack(deviceId, accessToken, { uris: [track.uri] });
      setActiveNav('now-playing');
    } catch (err) {
      console.error('Play failed:', err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      clearTimeout(debounceRef.current);
      handleSearch(query);
    }
  };

  return (
    <div className="wmp-search">
      <div className="wmp-search-bar">
        <input
          type="text"
          className="wmp-search-input"
          placeholder="Search Spotify..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
      <div className="wmp-search-results">
        {loading && <div className="wmp-search-loading">Searching...</div>}
        {!loading && results.length === 0 && query && (
          <div className="wmp-search-empty">No results</div>
        )}
        {results.map((track) => (
          <div
            key={track.id}
            className="wmp-search-result"
            onClick={() => handlePlay(track)}
          >
            {track.albumArt && (
              <img src={track.albumArt} alt="" className="wmp-search-art" />
            )}
            <div className="wmp-search-info">
              <div className="wmp-search-track-name">{track.name}</div>
              <div className="wmp-search-track-artist">
                {track.artist} &middot; {track.album}
              </div>
            </div>
            <span className="wmp-search-duration">
              {formatMs(track.duration)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
