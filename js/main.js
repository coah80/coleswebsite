const _i = '761701756119547955';
let socket;

document.addEventListener('DOMContentLoaded', async () => {
  await _f();
  renderMusicLogs();
  renderGameLogs();
  _c();
});

function _c() {
  socket = new WebSocket('wss://api.lanyard.rest/socket');

  socket.onopen = () => {
    const _t = _b();
    socket.send(JSON.stringify({ op: 2, d: { subscribe_to_id: _i, api_key: _t } }));
  };

  socket.onmessage = e => {
    try {
      const msg = JSON.parse(e.data);
      if (msg.t === 'INIT_STATE' || msg.t === 'PRESENCE_UPDATE') {
        handleActivity(msg.d);
      }
      if (msg.op === 1) {
        const _t = _b();
        socket.send(JSON.stringify({ op: 2, d: { subscribe_to_id: _i, api_key: _t } }));
      }
    } catch (err) {}
  };

  socket.onclose = () => {
    setTimeout(_c, 5000);
  };
  
  socket.onerror = err => {};
}

function handleActivity(data) {
  updateProfile(data);
  updateSpotify(data);
  updateActivity(data);
}

function _p(input) {
  const _arr = [];
  for (let i = 0; i < input.length; i += 2) {
    _arr.push(parseInt(input.substr(i, 2), 16));
  }
  return String.fromCharCode.apply(null, _arr);
}

function _o(_s) {
  let _p = '';
  for (let i = 0; i < _s.length; i++) {
    const _c = _s.charCodeAt(i);
    _p += String.fromCharCode(_c ^ ((i % 9) + 1));
  }
  return _p;
}

function updateProfile(data) {
  if (!data || !data.discord_user) return;
  
  const user = data.discord_user;
  const avatarUrl = user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp?size=512` : 'assets/default-avatar.png';
  
  document.querySelector('.discord-avatar').src = avatarUrl;
  document.querySelector('.discord-name').textContent = user.username;
  
  const statusDot = document.querySelector('.status-dot');
  const status = data.discord_status;
  statusDot.className = `status-dot status-${status}`;
}

function updateSpotify(data) {
  const spotifyContainer = document.querySelector('.spotify-container');
  const spotifyNowPlaying = document.querySelector('.spotify-now-playing');
  const spotifyTrack = document.querySelector('.spotify-track');
  const spotifyArtist = document.querySelector('.spotify-artist');
  const spotifyAlbum = document.querySelector('.spotify-album');
  const spotifyTimestamp = document.querySelector('.spotify-time');
  
  if (data.spotify) {
    const { song, artist, album, album_art_url, timestamps } = data.spotify;
    
    document.querySelector('.spotify-album-art').src = album_art_url;
    spotifyTrack.textContent = song;
    spotifyArtist.textContent = artist;
    spotifyAlbum.textContent = album;
    
    spotifyContainer.style.display = 'flex';
    
    if (timestamps) {
      updateSpotifyTimestamp(timestamps.start, timestamps.end);
      spotifyTimestamp.style.display = 'block';
    } else {
      spotifyTimestamp.style.display = 'none';
    }
  } else {
    spotifyContainer.style.display = 'none';
  }
}

function _a(_t) {
  return _t.split('').map(char => {
    const code = char.charCodeAt(0);
    if (code >= 65 && code <= 90)
      return String.fromCharCode(((code - 65 + 11) % 26) + 65);
    if (code >= 97 && code <= 122)
      return String.fromCharCode(((code - 97 + 11) % 26) + 97);
    if (code >= 48 && code <= 57)
      return String.fromCharCode(((code - 48 + 5) % 10) + 48);
    return char;
  }).join('');
}

function _n(_s) {
  const _h = [
    "687474", "70733a", "2f2f63", "6f6c65", "2d6c6f", "67732d",
    "61386338", "312d64", "656661", "756c74", "2d7274", "64622e", 
    "666972", "656261", "73652e", "696f"
  ];
  const _j = _h.map(_p).join('');
  return _j;
}

function _b() {
  const _y = [
    "u7fW8k",
    "mVX3lP",
    "K9pO4q",
    "T2aZ6c",
    "R5vB7n",
    "E1sD0j",
    "G4hY3m"
  ];
  
  const _q = [4, 1, 6, 2, 0, 5, 3];
  
  let _w = "";
  for (let i = 0; i < _q.length; i++) {
    _w += _y[_q[i]];
  }
  
  _w = _a(_w);
  _w = _w.split('').reverse().join('');
  
  try {
    const _v = atob(_w);
    if (_v.length !== 32) {
      return "invalid_key";
    }
    
    return _v.split('').map((c, i) => {
      return String.fromCharCode(c.charCodeAt(0) ^ ((i * 3) % 13));
    }).join('');
  } catch (e) {
    return "invalid_key";
  }
}


function _g() {
  return _n();
}


async function _f() {
  try {
    const baseUrl = _g();
    const [musicRes, gameRes] = await Promise.all([
      fetch(`${baseUrl}/musicLogs.json`).then(r => r.json()),
      fetch(`${baseUrl}/gameLogs.json`).then(r => r.json())
    ]);

    musicLogs = Array.isArray(musicRes) ? musicRes : Object.values(musicRes || {});
    gameLogs = Array.isArray(gameRes) ? gameRes : Object.values(gameRes || {});

    musicLogs.sort((a, b) => b.loggedAt - a.loggedAt);
    gameLogs.sort((a, b) => b.loggedAt - a.loggedAt);
  } catch (err) {}
}

// Global function to save logs
async function _s() {
  musicLogs.sort((a, b) => b.loggedAt - a.loggedAt);
  gameLogs.sort((a, b) => b.loggedAt - a.loggedAt);

  const baseUrl = _g();
  await Promise.all([
    fetch(`${baseUrl}/musicLogs.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(musicLogs)
    }),
    fetch(`${baseUrl}/gameLogs.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gameLogs)
    })
  ]);
}

function updateActivity(data) {
  const activityContainer = document.querySelector('.activity-container');
  
  if (data.activities && data.activities.length > 0) {
    const nonSpotifyActivities = data.activities.filter(activity => activity.type !== 2);
    
    if (nonSpotifyActivities.length > 0) {
      const mainActivity = nonSpotifyActivities[0];
      
      if (mainActivity.name === 'Visual Studio Code') {
        updateVSCodeActivity(mainActivity);
      } else if (mainActivity.type === 0) {
        updateGameActivity(mainActivity);
      } else {
        activityContainer.style.display = 'none';
      }
    } else {
      activityContainer.style.display = 'none';
    }
  } else {
    activityContainer.style.display = 'none';
  }
}

window._g = _g;
window._f = _f;
window._s = _s;