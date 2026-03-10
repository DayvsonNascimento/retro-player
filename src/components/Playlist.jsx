import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { playTrack, getUserPlaylists, getPlaylistTracks } from '../utils/spotify';

function formatMs(ms) {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

// Handles Spotify track relinking: SDK and queue API can return different IDs
// for the same song (regional/album variants). Match by ID first, then name+artist.
function isSameTrack(a, b) {
  if (!a || !b) return false;
  if (a.id === b.id) return true;
  return (
    a.name?.toLowerCase() === b.name?.toLowerCase() &&
    a.artist?.toLowerCase() === b.artist?.toLowerCase()
  );
}

export default function Playlist({ style }) {
  const tracks = useStore((s) => s.tracks);
  const currentTrack = useStore((s) => s.currentTrack);
  const playlistName = useStore((s) => s.playlistName);
  const tracksLoading = useStore((s) => s.tracksLoading);
  const accessToken = useStore((s) => s.accessToken);
  const deviceId = useStore((s) => s.deviceId);
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const setTracks = useStore((s) => s.setTracks);
  const setTracksLoading = useStore((s) => s.setTracksLoading);

  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [loadingPlaylist, setLoadingPlaylist] = useState(false);
  const [view, setView] = useState('tracks');

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    getUserPlaylists(accessToken)
      .then((data) => {
        const items = data?.items || [];
        setPlaylists(items);
        if (items.length > 0 && tracks.length === 0) {
          setView('playlists');
        }
      })
      .catch(() => {});
  }, [isAuthenticated, accessToken]);

  useEffect(() => {
    if (tracks.length > 0) setView('tracks');
  }, [tracks.length]);

  const handleSelectPlaylist = async (playlist) => {
    if (!accessToken || !deviceId) return;
    setSelectedPlaylist(playlist);
    setLoadingPlaylist(true);

    try {
      const data = await getPlaylistTracks(playlist.id, accessToken);
      const items = (data?.items || [])
        .map((i) => i.track)
        .filter(Boolean)
        .map((t) => ({
          id: t.id,
          uri: t.uri,
          name: t.name,
          artist: t.artists.map((a) => a.name).join(', '),
          album: t.album.name,
          albumArt: t.album.images?.[t.album.images.length - 1]?.url,
          duration: t.duration_ms,
        }));
      setTracks(items, playlist.name);
      setView('tracks');
    } catch (err) {
      // 403 or restricted playlist — the track list can only be populated once
      // playback starts (via player_state_changed + queue API). Autoplay is required
      // here; it is NOT suppressed because there is no other way to load the tracks.
      setTracks([], playlist.name);
      setView('tracks');
      // Set tracksLoading=true before loadingPlaylist goes false (via finally) so the
      // spinner transitions seamlessly without a gap where neither flag is active.
      setTracksLoading(true);
      if (deviceId) {
        playTrack(deviceId, accessToken, { contextUri: playlist.uri }).catch(
          (err) => console.error('Play via context_uri failed:', err)
        );
      }
    } finally {
      setLoadingPlaylist(false);
    }
  };


  const handlePlayTrack = async (track, index) => {
    if (!deviceId || !accessToken) return;
    // Don't restart if this track is already playing
    if (isSameTrack(currentTrack, track)) return;
    const uris = tracks.map((t) => t.uri);
    try {
      if (uris.length > 0) {
        await playTrack(deviceId, accessToken, { uris, offset: index });
      } else if (selectedPlaylist) {
        await playTrack(deviceId, accessToken, {
          contextUri: selectedPlaylist.uri,
          offset: index,
        });
      }
    } catch (err) {
      console.error('Play failed:', err);
    }
  };

  const displayName = selectedPlaylist?.name || playlistName;

  return (
    <div className="wmp-playlist" style={style}>
      <div className="wmp-playlist-header">
        <select
          className="wmp-playlist-select"
          value={view}
          onChange={(e) => setView(e.target.value)}
        >
          <option value="tracks">{displayName}</option>
          {playlists.length > 0 && (
            <option value="playlists">My Playlists ({playlists.length})</option>
          )}
        </select>
      </div>

      <div className="wmp-playlist-tracks">
        {view === 'playlists' && (
          <>
            {playlists.length === 0 && (
              <div className="wmp-playlist-empty">No playlists found</div>
            )}
            {playlists.map((pl) => (
              <div
                key={pl.id}
                className={`wmp-playlist-track ${selectedPlaylist?.id === pl.id ? 'active' : ''}`}
                onClick={() => handleSelectPlaylist(pl)}
              >
                {pl.images?.[0]?.url && (
                  <img src={pl.images[0].url} alt="" className="wmp-playlist-art" />
                )}
                <span className="wmp-track-name-col">
                  <span className="wmp-track-link">{pl.name}</span>
                  <span className="wmp-playlist-count">{pl.tracks?.total} tracks</span>
                </span>
              </div>
            ))}
          </>
        )}

        {view === 'tracks' && (
          <>
            {(loadingPlaylist || tracksLoading) && (
              <div className="wmp-playlist-loading">
                <span className="wmp-playlist-spinner" />
                Loading tracks...
              </div>
            )}
            {!loadingPlaylist && !tracksLoading && tracks.length === 0 && (
              <div className="wmp-playlist-empty">
                {selectedPlaylist
                  ? 'No tracks found'
                  : playlists.length > 0
                  ? 'Select a playlist from the dropdown above'
                  : 'Search for a song or play something on Spotify'}
              </div>
            )}
            {!loadingPlaylist && !tracksLoading && tracks.map((track, i) => {
              const playing = isSameTrack(currentTrack, track);
              return (
                <div
                  key={`${track.id}-${i}`}
                  className={`wmp-playlist-track ${playing ? 'active' : ''}`}
                  onClick={() => handlePlayTrack(track, i)}
                >
                  <span className="wmp-track-bullet">{playing ? '▶' : '•'}</span>
                  <span className="wmp-track-name-col">
                    <span className="wmp-track-link">{track.name}</span>
                  </span>
                  <span className="wmp-track-duration">{formatMs(track.duration)}</span>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
