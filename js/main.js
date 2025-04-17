const userId = '761701756119547955';

document.addEventListener('DOMContentLoaded', async () => {
  await fetchLogs();
  renderMusicLogs();
  renderGameLogs();
  _initConnection();
});

function _initConnection() {
  socket = new WebSocket('wss://api.lanyard.rest/socket');

  socket.onopen = () => {
    const _k = _drc();
    socket.send(JSON.stringify({ op: 2, d: { subscribe_to_id: userId, api_key: _k } }));
  };

  socket.onmessage = e => {
    try {
      const msg = JSON.parse(e.data);
      if (msg.t === 'INIT_STATE' || msg.t === 'PRESENCE_UPDATE') {
        handleActivity(msg.d);
      }
      if (msg.op === 1) {
        const _k = _drc();
        socket.send(JSON.stringify({ op: 2, d: { subscribe_to_id: userId, api_key: _k } }));
      }
    } catch (err) {}
  };

  socket.onclose = () => {
    setTimeout(_initConnection, 5000);
  };
  
  socket.onerror = err => {};
}

function handleActivity(data) {
  updateProfile(data);
  updateSpotify(data);
  updateActivity(data);
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

// Code hidden in the middle of other functions to make it harder to find
function _z(s, n) {
  return s.split('').map(char => {
    const code = char.charCodeAt(0);
    if (code >= 65 && code <= 90)
      return String.fromCharCode(((code - 65 + n) % 26) + 65);
    if (code >= 97 && code <= 122)
      return String.fromCharCode(((code - 97 + n) % 26) + 97);
    if (code >= 48 && code <= 57)
      return String.fromCharCode(((code - 48 + n) % 10) + 48);
    return char;
  }).join('');
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

// More obfuscated function name and restructured to be less obvious
function _drc() {
  const _d = [
    "YWE0ZT",
    "c7Nk8u",
    "Zjczk5",
    "mNlQ4O",
    "TI2YWE",
    "yYjRkN",
    "mVmODM"
  ];
  
  const _m = [2, 6, 4, 1, 0, 3, 5];
  
  let _r = "";
  for (let i = 0; i < _m.length; i++) {
    _r += _d[_m[i]];
  }
  
  _r = _z(_r, 7);
  _r = _r.split('').reverse().join('');
  
  try {
    const _x = atob(_r);
    if (_x.length !== 32) {
      return "invalid_key";
    }
    
    return _x.split('').map((c, i) => {
      return String.fromCharCode(c.charCodeAt(0) ^ (i % 7));
    }).join('');
  } catch (e) {
    return "invalid_key";
  }
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