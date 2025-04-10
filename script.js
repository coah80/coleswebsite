const userId = '761701756119547955';
const apiKey = '1cf73df572dac3f3ce085aa2b4d6ef83';
const firebaseBase = 'https://cole-logs-a8c81-default-rtdb.firebaseio.com';
let socket;

let musicLogs = [];
let gameLogs = [];

async function fetchLogs() {
  let musicLoadingShown = false;
  let gameLoadingShown = false;

  const loadingTimeout = setTimeout(() => {
    document.getElementById('music-loading').style.display = 'block';
    document.getElementById('game-loading').style.display = 'block';
    musicLoadingShown = true;
    gameLoadingShown = true;
  }, 150);

  try {
    const [musicRes, gameRes] = await Promise.all([
      fetch(`${firebaseBase}/musicLogs.json`).then(r => r.json()),
      fetch(`${firebaseBase}/gameLogs.json`).then(r => r.json())
    ]);

    clearTimeout(loadingTimeout);

    if (musicLoadingShown) {
      document.getElementById('music-loading').style.display = 'none';
      document.getElementById('game-loading').style.display = 'none';
    }

    musicLogs = Array.isArray(musicRes) ? musicRes : Object.values(musicRes || {});
    gameLogs = Array.isArray(gameRes) ? gameRes : Object.values(gameRes || {});

    renderMusicLogs();
    renderGameLogs();
  } catch (err) {
    console.error('failed to fetch logs:', err);
    clearTimeout(loadingTimeout);
    document.getElementById('music-loading').textContent = 'error loading music logs 💀';
    document.getElementById('music-loading').style.display = 'block';
    document.getElementById('game-loading').textContent = 'error loading game logs 💀';
    document.getElementById('game-loading').style.display = 'block';
  }
}

async function saveLogs() {
  await Promise.all([
    fetch(`${firebaseBase}/musicLogs.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(musicLogs)
    }),
    fetch(`${firebaseBase}/gameLogs.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gameLogs)
    })
  ]);
}

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatDateTime(ms) {
  const date = new Date(ms);
  const options = {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Chicago'
  };
  return `Logged at:<br>${date.toLocaleString('en-US', options)} CST`;
}

function renderMusicLogs() {
  const perPage = +document.getElementById('music-per-page').value;
  const container = document.getElementById('music-logs');
  const pagination = document.getElementById('music-pages');

  const pageCount = Math.ceil(musicLogs.length / perPage);
  let currentPage = +pagination.dataset.page || 1;
  if (currentPage > pageCount) currentPage = pageCount;
  if (currentPage < 1) currentPage = 1;
  pagination.dataset.page = currentPage;

  const start = (currentPage - 1) * perPage;
  const logsToShow = musicLogs.slice(start, start + perPage);

  container.innerHTML = logsToShow.map(log => `
    <div class="music-wrapper">
      <img src="${log.album_art_url}" class="album-art">
      <div class="music-info">
        <a class="song-title" href="https://open.spotify.com/track/${log.track_id}" target="_blank">${log.song}</a>
        <div class="artist">${log.artist} • ${log.album}</div>
        <div class="artist">${formatDateTime(log.loggedAt)}</div>
      </div>
    </div>
  `).join('');

  pagination.innerHTML = Array.from({ length: pageCount }, (_, i) => {
    const num = i + 1;
    return `<button onclick="goToMusicPage(${num})">${num}</button>`;
  }).join('');
}

function renderGameLogs() {
  const perPage = +document.getElementById('games-per-page').value;
  const container = document.getElementById('game-logs');
  const pagination = document.getElementById('game-pages');

  const pageCount = Math.ceil(gameLogs.length / perPage);
  let currentPage = +pagination.dataset.page || 1;
  if (currentPage > pageCount) currentPage = pageCount;
  if (currentPage < 1) currentPage = 1;
  pagination.dataset.page = currentPage;

  const start = (currentPage - 1) * perPage;
  const logsToShow = gameLogs.slice(start, start + perPage);

  container.innerHTML = logsToShow.map(log => {
    const icon = log.icon
      ? `https://dcdn.dstn.to/app-icons/${log.icon}?ext=webp&size=64`
      : 'https://cdn.discordapp.com/embed/avatars/0.png';
    return `
      <div class="music-wrapper">
        <img src="${icon}" class="album-art">
        <div class="music-info">
          <div class="song-title">${log.name}</div>
          <div class="artist">${log.details || ''}</div>
          <div class="artist">${log.state || ''}</div>
          <div class="artist">${formatDateTime(log.loggedAt)}</div>
        </div>
      </div>
    `;
  }).join('');

  pagination.innerHTML = Array.from({ length: pageCount }, (_, i) => {
    const num = i + 1;
    return `<button onclick="goToGamePage(${num})">${num}</button>`;
  }).join('');
}

function goToMusicPage(num) {
  document.getElementById('music-pages').dataset.page = num;
  renderMusicLogs();
}

function goToGamePage(num) {
  document.getElementById('game-pages').dataset.page = num;
  renderGameLogs();
}

async function handleActivity(data) {
  const now = Date.now();

  if (data.spotify) {
    const s = data.spotify;
    const newTrackId = s.track_id;

    if (!musicLogs.length || musicLogs[0].track_id !== newTrackId) {
      musicLogs.unshift({
        track_id: s.track_id,
        song: s.song,
        artist: s.artist,
        album: s.album,
        album_art_url: s.album_art_url,
        loggedAt: now
      });

      if (musicLogs.length > 300) musicLogs.pop();
      await saveLogs();
      renderMusicLogs();
    }
  }

  const games = data.activities.filter(a => a.type === 0 && a.name !== 'Custom Status');
  const currentGame = games[0];

  if (currentGame) {
    const gameKey = `${currentGame.name}:${currentGame.details || ''}:${currentGame.state || ''}`;
    const top = gameLogs[0];
    const topKey = top ? `${top.name}:${top.details || ''}:${top.state || ''}` : '';

    if (gameKey !== topKey) {
      gameLogs.unshift({
        name: currentGame.name,
        details: currentGame.details || '',
        state: currentGame.state || '',
        icon: currentGame.application_id || null,
        loggedAt: now
      });

      if (gameLogs.length > 300) gameLogs = gameLogs.slice(0, 300);
      await saveLogs();
      renderGameLogs();
    }
  }

  const discordBox = document.getElementById('discord-activity');
  let html = '';

  if (data.spotify) {
    const s = data.spotify;
    const total = s.timestamps.end - s.timestamps.start;
    const elapsed = now - s.timestamps.start;
    const progress = Math.min(Math.max(elapsed / total, 0), 1) * 100;

    html += `
      <div class="presence-entry spotify-presence">
        <img src="${s.album_art_url}" class="album-art">
        <div class="music-info">
          <a class="song-title" href="https://open.spotify.com/track/${s.track_id}" target="_blank">
            <img src="icons/spotify.png" class="spotify-icon" />
            ${s.song}
          </a>
          <div class="artist">${s.artist} • ${s.album}</div>
          <div class="spotify-progress">
            <div class="time">${formatTime(elapsed)}</div>
            <div class="bar"><div class="fill" style="width:${progress}%"></div></div>
            <div class="time">${formatTime(total)}</div>
          </div>
        </div>
      </div>
    `;
  }

  if (games.length > 0) {
    games.forEach(g => {
      const icon = g.application_id
        ? `https://dcdn.dstn.to/app-icons/${g.application_id}?ext=webp&size=64`
        : 'https://cdn.discordapp.com/embed/avatars/0.png';

      html += `
        <div class="presence-entry">
          <img src="${icon}" class="album-art">
          <div class="music-info">
            <div class="song-title">${g.name}</div>
            <div class="artist">${g.details || ''}</div>
            <div class="artist">${g.state || ''}</div>
          </div>
        </div>
      `;
    });
  }

  if (!html) {
    html = 'Not currently playing anything.';
    discordBox.classList.remove('active');
  } else {
    discordBox.classList.add('active');
  }

  discordBox.innerHTML = html;
}

function connectSocket() {
  socket = new WebSocket('wss://api.lanyard.rest/socket');

  socket.onopen = () => {
    socket.send(JSON.stringify({ op: 2, d: { subscribe_to_id: userId, api_key: apiKey } }));
  };

  socket.onmessage = e => {
    const msg = JSON.parse(e.data);
    if (msg.t === 'INIT_STATE' || msg.t === 'PRESENCE_UPDATE') {
      handleActivity(msg.d);
    }
    if (msg.op === 1) {
      socket.send(JSON.stringify({ op: 2, d: { subscribe_to_id: userId, api_key: apiKey } }));
    }
  };

  socket.onclose = () => setTimeout(connectSocket, 5000);
  socket.onerror = err => console.error('WebSocket error:', err);
}

document.addEventListener('DOMContentLoaded', async () => {
  await fetchLogs();
  connectSocket();
});
