# Retro Media Player

A web-based clone of the classic Windows Media Player (XP era), built with React and powered by Spotify.

![Windows Media Player](https://i.imgur.com/placeholder.png)

## Features

- Classic Windows Media Player XP look and feel
- Animated canvas visualizer ("Ambience: Water" style)
- Full Spotify integration (search, play, playlists)
- Media controls: play/pause, stop, previous, next, seek, volume, shuffle, repeat
- Playlist display with now-playing highlighting
- Spotify PKCE authentication (no backend / no secrets required)

## Prerequisites

- **Node.js** 18+ and npm
- **Spotify Premium** account (required for Web Playback SDK)
- **Spotify Developer App** (free to create)

## Setup

### 1. Create a Spotify Developer App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click **Create App**
3. Fill in the details:
   - **App name**: Retro Media Player (or anything you like)
   - **App description**: anything
   - **Redirect URI**: `http://localhost:5173/callback.html`
   - **Which API/SDKs are you planning to use?**: Select **Web Playback SDK** and **Web API**
4. Click **Save**
5. On the app settings page, copy your **Client ID**

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and paste your Client ID:

```
VITE_SPOTIFY_CLIENT_ID=your_actual_client_id_here
```

### 3. Install & Run

```bash
npm install
npm run dev
```

The app will start at [http://localhost:5173](http://localhost:5173).

## Usage

1. Open the app in your browser
2. Click **Connect to Spotify** in the center of the player
3. A popup will open for Spotify authorization — log in and approve
4. Once connected, click **Search Music** or go to **Media Library** in the left nav
5. Search for songs and click to play them
6. Use the transport controls at the bottom to control playback

## Architecture

```
src/
├── components/
│   ├── TitleBar.jsx         # Window chrome
│   ├── MenuBar.jsx          # File/View/Play/Tools/Help
│   ├── NavPanel.jsx         # Left sidebar navigation
│   ├── Visualizer.jsx       # Canvas animation
│   ├── Playlist.jsx         # Track list panel
│   ├── Controls.jsx         # Transport + seek + volume
│   ├── NowPlaying.jsx       # Connection status + search toggle
│   └── SpotifySearch.jsx    # Search input + results
├── hooks/
│   ├── useSpotifyAuth.js    # PKCE auth flow
│   ├── useSpotifyPlayer.js  # Web Playback SDK
│   └── useVisualizer.js     # Canvas animation engine
├── store/index.js           # Zustand state management
├── utils/spotify.js         # Spotify API helpers
├── styles/wmp.css           # Retro WMP theme
├── App.jsx
└── main.jsx
```

## Security

- Uses **Spotify PKCE** (Proof Key for Code Exchange) — no client secret needed
- The `VITE_SPOTIFY_CLIENT_ID` is a **public identifier**, not a secret
- Access tokens are stored in memory only (Zustand store), never in localStorage
- Tokens auto-refresh before expiry
- The callback page uses `postMessage` with origin validation

## Tech Stack

- **React 19** + **Vite**
- **Zustand** for state management
- **Spotify Web Playback SDK** for audio playback
- **Spotify Web API** for search and playlist data
- **Canvas API** for the animated visualizer
- Plain CSS (no UI framework)

## License

MIT
