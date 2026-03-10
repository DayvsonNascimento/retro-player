const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = `${window.location.origin}/callback.html`;
const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-modify-playback-state',
  'user-read-playback-state',
  'playlist-read-private',
  'playlist-read-collaborative',
].join(' ');

function generateRandomString(length) {
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
}

async function sha256(plain) {
  const data = new TextEncoder().encode(plain);
  return crypto.subtle.digest('SHA-256', data);
}

function base64urlencode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function startAuth() {
  const codeVerifier = generateRandomString(64);
  localStorage.setItem('spotify_code_verifier', codeVerifier);

  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64urlencode(hashed);

  const authUrl = new URL('https://accounts.spotify.com/authorize');
  authUrl.search = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    scope: SCOPES,
  }).toString();

  window.location.href = authUrl.toString();
}

export async function exchangeCode(code) {
  const codeVerifier = localStorage.getItem('spotify_code_verifier');
  localStorage.removeItem('spotify_code_verifier');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error_description || 'Token exchange failed');
  }
  return response.json();
}

export async function refreshAccessToken(refreshToken) {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) throw new Error('Token refresh failed');
  return response.json();
}

async function spotifyFetch(endpoint, token, options = {}) {
  const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error('TOKEN_EXPIRED');
    throw new Error(`Spotify API error: ${response.status}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

export async function searchTracks(query, token) {
  const params = new URLSearchParams({ q: query, type: 'track', limit: '20' });
  return spotifyFetch(`/search?${params}`, token);
}

export async function getUserPlaylists(token) {
  return spotifyFetch('/me/playlists?limit=50', token);
}

export async function getPlaylistTracks(playlistId, token) {
  return spotifyFetch(`/playlists/${playlistId}/tracks?limit=100`, token);
}

export async function getPlayerQueue(token) {
  return spotifyFetch('/me/player/queue', token);
}

export async function playTrack(deviceId, token, { uris, contextUri, offset } = {}) {
  const body = {};
  if (uris) body.uris = uris;
  if (contextUri) body.context_uri = contextUri;
  if (offset !== undefined) body.offset = { position: offset };

  await fetch(
    `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );
}

export async function pausePlayback(deviceId, token) {
  await fetch(
    `https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    }
  );
}

export async function setPlayerShuffle(state, token) {
  await fetch(
    `https://api.spotify.com/v1/me/player/shuffle?state=${state}`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    }
  );
}

export async function setPlayerRepeat(state, token) {
  await fetch(
    `https://api.spotify.com/v1/me/player/repeat?state=${state}`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    }
  );
}
