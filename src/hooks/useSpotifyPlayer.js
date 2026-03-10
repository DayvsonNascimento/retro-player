import { useEffect, useCallback, useRef } from 'react';
import { useStore } from '../store';
import { getPlayerQueue } from '../utils/spotify';

export function useSpotifyPlayer() {
  const accessToken = useStore((s) => s.accessToken);
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const deviceId = useStore((s) => s.deviceId);
  const volume = useStore((s) => s.volume);
  const setPlayer = useStore((s) => s.setPlayer);
  const setDeviceId = useStore((s) => s.setDeviceId);
  const setCurrentTrack = useStore((s) => s.setCurrentTrack);
  const setPlayState = useStore((s) => s.setPlayState);
  const setPosition = useStore((s) => s.setPosition);
  const setDuration = useStore((s) => s.setDuration);
  const setStoreVolume = useStore((s) => s.setVolume);
  const setTracks = useStore((s) => s.setTracks);
  const setTracksLoading = useStore((s) => s.setTracksLoading);

  const playerRef = useRef(null);
  const positionIntervalRef = useRef(null);
  const queueFetchingRef = useRef(false);
  // When a queue fetch returns stale data, stores the track ID to retry on
  // the next player_state_changed event (event-driven retry, no setTimeout).
  const queueRetryTrackIdRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    if (!document.getElementById('spotify-sdk-script')) {
      const script = document.createElement('script');
      script.id = 'spotify-sdk-script';
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      document.body.appendChild(script);
    }

    const initPlayer = () => {
      if (playerRef.current) return;

      const player = new window.Spotify.Player({
        name: 'Retro Media Player',
        getOAuthToken: (cb) => cb(useStore.getState().accessToken),
        volume: volume / 100,
      });

      player.addListener('ready', ({ device_id }) => {
        setDeviceId(device_id);
      });

      player.addListener('not_ready', () => {
        setDeviceId(null);
      });

      player.addListener('player_state_changed', (state) => {
        if (!state) return;

        const track = state.track_window.current_track;
        if (track) {
          setCurrentTrack({
            id: track.id,
            uri: track.uri,
            name: track.name,
            artist: track.artists.map((a) => a.name).join(', '),
            album: track.album.name,
            albumArt: track.album.images[0]?.url,
            duration: track.duration_ms,
          });
        }

        setPlayState(!state.paused);
        setPosition(state.position);
        setDuration(state.duration);

        // Only populate the playlist from the SDK track_window when no tracks
        // are already loaded (e.g. the context_uri fallback path for 403 playlists).
        // The SDK window only exposes ~3 tracks so we never overwrite a full playlist.
        const storeTracksLen = useStore.getState().tracks.length;

        const shouldFetchQueue =
          // First time: store is empty (just entered the context_uri fallback path)
          storeTracksLen === 0 ||
          // Retry: previous queue fetch returned stale data for this exact track
          (queueRetryTrackIdRef.current !== null &&
            queueRetryTrackIdRef.current === track?.id &&
            storeTracksLen <= 3);

        // Determine up front whether we will start a queue fetch this tick.
        // We set tracksLoading=true BEFORE seeding SDK tracks so the spinner
        // is active during any render that shows the 2-track SDK window.
        const willFetchQueue = shouldFetchQueue && !queueFetchingRef.current;

        if (storeTracksLen === 0) {
          // Seed the list immediately with whatever the SDK window has
          const allTracks = [
            ...state.track_window.previous_tracks,
            state.track_window.current_track,
            ...state.track_window.next_tracks,
          ].filter(Boolean);

          // Set loading before seeding so the 2 SDK tracks are hidden behind
          // the spinner rather than flashing visible for one render.
          if (willFetchQueue) {
            queueFetchingRef.current = true;
            setTracksLoading(true);
          }

          if (allTracks.length > 0) {
            setTracks(
              allTracks.map((t) => ({
                id: t.id,
                uri: t.uri,
                name: t.name,
                artist: t.artists.map((a) => a.name).join(', '),
                album: t.album.name,
                albumArt: t.album.images[0]?.url,
                duration: t.duration_ms,
              }))
            );
          }
        }

        // Enrich with queue data — /me/player/queue returns up to 20 upcoming
        // tracks from the current context (much better than the SDK window's 2-3).
        // Freshness is validated by both track ID and track name to handle Spotify
        // track relinking (same song can have different IDs in the SDK vs queue API).
        if (willFetchQueue && storeTracksLen !== 0) {
          // Retry path: storeTracksLen > 0. Set refs here since we skipped the
          // storeTracksLen===0 branch above.
          queueFetchingRef.current = true;
          setTracksLoading(true);
        }
        if (willFetchQueue) {
          const token = useStore.getState().accessToken;
          const currentPlaylistName = useStore.getState().playlistName;
          const expectedTrackId = track?.id;
          const expectedTrackName = track?.name?.toLowerCase();
          getPlayerQueue(token)
            .then((queue) => {
              if (!queue) return;
              const queueCurrentId = queue.currently_playing?.id;
              const queueCurrentName = queue.currently_playing?.name?.toLowerCase();
              // Accept as fresh if IDs match OR names match (handles track relinking)
              const isFresh = queueCurrentId === expectedTrackId ||
                (expectedTrackName && queueCurrentName && queueCurrentName === expectedTrackName);
              if (!isFresh) {
                // Stale — retry when the next player_state_changed fires
                queueRetryTrackIdRef.current = expectedTrackId;
                return;
              }
              // Fresh data — clear retry flag and apply
              queueRetryTrackIdRef.current = null;
              const seen = new Set();
              const queueTracks = [
                queue.currently_playing,
                ...(queue.queue || []),
              ]
                .filter(Boolean)
                .filter((t) => {
                  if (seen.has(t.id)) return false;
                  seen.add(t.id);
                  return true;
                })
                .map((t) => ({
                  id: t.id,
                  uri: t.uri,
                  name: t.name,
                  artist: t.artists.map((a) => a.name).join(', '),
                  album: t.album.name,
                  albumArt: t.album.images[0]?.url,
                  duration: t.duration_ms,
                }));
              if (queueTracks.length > 0) {
                setTracks(queueTracks, currentPlaylistName);
              }
            })
            .catch(() => {})
            .finally(() => {
              queueFetchingRef.current = false;
              // Only clear the spinner when there is no pending retry.
              // If stale data was returned the retry ref is set and the spinner
              // must stay on until the retry fetch resolves with fresh data.
              if (queueRetryTrackIdRef.current === null) {
                setTracksLoading(false);
              }
            });
        }
      });

      player.addListener('initialization_error', ({ message }) =>
        console.error('Spotify init error:', message)
      );
      player.addListener('authentication_error', ({ message }) =>
        console.error('Spotify auth error:', message)
      );
      player.addListener('account_error', ({ message }) =>
        console.error('Spotify account error (Premium required):', message)
      );

      player.connect();
      playerRef.current = player;
      setPlayer(player);
    };

    if (window.Spotify) {
      initPlayer();
    } else {
      window.onSpotifyWebPlaybackSDKReady = initPlayer;
    }

    return () => {
      clearInterval(positionIntervalRef.current);
      if (playerRef.current) {
        playerRef.current.disconnect();
        playerRef.current = null;
      }
    };
  }, [isAuthenticated, accessToken]);

  useEffect(() => {
    clearInterval(positionIntervalRef.current);
    if (!playerRef.current || !deviceId) return;

    positionIntervalRef.current = setInterval(async () => {
      const state = await playerRef.current?.getCurrentState();
      if (state && !state.paused) {
        setPosition(state.position);
      }
    }, 500);

    return () => clearInterval(positionIntervalRef.current);
  }, [deviceId, setPosition]);

  const togglePlay = useCallback(async () => {
    if (playerRef.current) await playerRef.current.togglePlay();
  }, []);

  const nextTrack = useCallback(async () => {
    if (playerRef.current) await playerRef.current.nextTrack();
  }, []);

  const previousTrack = useCallback(async () => {
    if (playerRef.current) await playerRef.current.previousTrack();
  }, []);

  const seek = useCallback(async (ms) => {
    if (playerRef.current) await playerRef.current.seek(ms);
  }, []);

  const setVolume = useCallback(
    async (vol) => {
      setStoreVolume(vol);
      if (playerRef.current) await playerRef.current.setVolume(vol / 100);
    },
    [setStoreVolume]
  );

  return { deviceId, togglePlay, nextTrack, previousTrack, seek, setVolume };
}
