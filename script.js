const userId = '761701756119547955';
const apiKey = 'd462adce227a99a6793c5d1edef7c6db';
let progressInterval;
let richInterval;
let socket;

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function updateSpotifyProgress(start, end) {
  const now = Date.now();
  const total = end - start;
  let elapsed = now - start;
  if (elapsed > total) elapsed = total;
  const percent = Math.min(100, (elapsed / total) * 100);
  const bar = document.querySelector('.progress-bar');
  const currentTime = document.getElementById('current-time');
  const totalTime = document.getElementById('total-time');
  if (bar) bar.style.width = percent + '%';
  if (currentTime) currentTime.textContent = formatTime(elapsed);
  if (totalTime) totalTime.textContent = formatTime(total);
}

function updateRichPresenceTimers() {
  document.querySelectorAll('.rich-timer').forEach(timer => {
    const start = parseInt(timer.dataset.start, 10);
    const elapsed = Date.now() - start;
    timer.textContent = `Playing for ${formatTime(elapsed)}`;
  });
}

function clearProgressUpdater() {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
  if (richInterval) {
    clearInterval(richInterval);
    richInterval = null;
  }
}

function renderActivity(data) {
  const activityBox = document.getElementById('discord-activity');
  const idCard = document.querySelector('.id-card');
  activityBox.innerHTML = '';
  clearProgressUpdater();

  const presence = data.discord_status;
  const statusDot = document.createElement('div');
  statusDot.classList.add('status-dot', `status-${presence}`);

  let pfpImg = document.querySelector('.left-section img');
  if (pfpImg && !pfpImg.parentNode.classList.contains('status-wrapper')) {
    const wrapper = document.createElement('div');
    wrapper.className = 'status-wrapper';
    pfpImg.parentNode.replaceChild(wrapper, pfpImg);
    wrapper.appendChild(pfpImg);
    wrapper.appendChild(statusDot);
  } else if (pfpImg && pfpImg.parentNode.classList.contains('status-wrapper')) {
    const wrapper = pfpImg.parentNode;
    const existingDot = wrapper.querySelector('.status-dot');
    if (existingDot) existingDot.remove();
    wrapper.appendChild(statusDot);
  }

  if (data.spotify) {
    const spotify = data.spotify;
    const wrapper = document.createElement('div');
    wrapper.className = 'music-wrapper';
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'row';
    wrapper.style.alignItems = 'center';
    wrapper.style.width = '100%';
    wrapper.style.gap = '12px';
    wrapper.style.marginBottom = '16px';

    const albumArt = document.createElement('img');
    albumArt.src = spotify.album_art_url;
    albumArt.className = 'album-art spinning';
    wrapper.appendChild(albumArt);

    const musicInfo = document.createElement('div');
    musicInfo.className = 'music-info';

    const spotifyLogo = document.createElement('img');
    spotifyLogo.src = 'icons/spotify.png'; // updated path
    spotifyLogo.className = 'spotify-logo';
    musicInfo.appendChild(spotifyLogo);

    const songLink = document.createElement('a');
    songLink.href = `https://open.spotify.com/track/${spotify.track_id}`;
    songLink.target = '_blank';
    songLink.className = 'song-title';
    songLink.textContent = spotify.song;
    musicInfo.appendChild(songLink);

    const artistAlbumText = document.createElement('div');
    artistAlbumText.className = 'artist';
    artistAlbumText.textContent = `${spotify.artist} • ${spotify.album}`;
    musicInfo.appendChild(artistAlbumText);

    const progress = document.createElement('div');
    progress.className = 'progress-container';
    progress.innerHTML = '<div class="progress-bar"></div>';
    musicInfo.appendChild(progress);

    const timeRow = document.createElement('div');
    timeRow.className = 'time-stamps';
    timeRow.innerHTML = `
      <span id="current-time">${formatTime(Date.now() - spotify.timestamps.start)}</span>
      <span id="total-time">${formatTime(spotify.timestamps.end - spotify.timestamps.start)}</span>
    `;
    musicInfo.appendChild(timeRow);

    wrapper.appendChild(musicInfo);
    activityBox.appendChild(wrapper);

    updateSpotifyProgress(spotify.timestamps.start, spotify.timestamps.end);
    progressInterval = setInterval(() => {
      updateSpotifyProgress(spotify.timestamps.start, spotify.timestamps.end);
    }, 1000);
  }

  const filteredActivities = data.activities.filter(
    act => act.type === 0 && act.name !== 'Custom Status'
  );

  filteredActivities.forEach((act, index) => {
    const container = document.createElement('div');
    container.className = 'music-wrapper';
    container.style.display = 'flex';
    container.style.flexDirection = 'row';
    container.style.alignItems = 'center';
    container.style.width = '100%';
    container.style.gap = '12px';
    container.style.marginBottom = '12px';

    const img = document.createElement('img');
    if (act.application_id) {
      img.src = `https://dcdn.dstn.to/app-icons/${act.application_id}?ext=webp&size=240`;
    } else if (act.assets?.large_image && act.assets.large_image.startsWith('mp:external')) {
      img.src = `https://media.discordapp.net/${act.assets.large_image.replace("mp:", "")}.webp?size=240&keep_aspect_ratio=false`;
    } else {
      img.src = 'https://cdn.discordapp.com/embed/avatars/0.png';
    }
    img.className = 'album-art';

    if (act.application_id) {
      const smallImg = document.createElement('img');
      smallImg.src = `https://dcdn.dstn.to/app-icons/${act.application_id}?ext=png&size=64`;
      smallImg.className = 'small-art';

      const imgContainer = document.createElement('div');
      imgContainer.style.position = 'relative';
      imgContainer.style.display = 'inline-block';
      imgContainer.appendChild(img);

      smallImg.style.position = 'absolute';
      smallImg.style.bottom = '0';
      smallImg.style.right = '0';
      smallImg.style.width = '24px';
      smallImg.style.height = '24px';
      imgContainer.appendChild(smallImg);

      container.appendChild(imgContainer);
    } else {
      container.appendChild(img);
    }

    const text = document.createElement('div');
    text.className = 'music-info';

    const name = document.createElement('div');
    name.className = 'song-title';
    name.textContent = act.name;
    text.appendChild(name);

    if (act.details) {
      const detail = document.createElement('div');
      detail.className = 'artist';
      detail.textContent = act.details;
      text.appendChild(detail);
    }
    if (act.state) {
      const state = document.createElement('div');
      state.className = 'artist';
      state.textContent = act.state;
      text.appendChild(state);
    }
    if (act.timestamps?.start) {
      const timerDiv = document.createElement('div');
      timerDiv.className = 'artist rich-timer';
      timerDiv.id = `rich-timer-${index}`;
      timerDiv.dataset.start = act.timestamps.start;
      timerDiv.textContent = `Playing for ${formatTime(Date.now() - act.timestamps.start)}`;
      text.appendChild(timerDiv);
    }

    container.appendChild(text);
    activityBox.appendChild(container);
  });

  if (activityBox.innerHTML.trim() === '') {
    activityBox.style.display = 'none';
    idCard?.classList.remove('expanded');
  } else {
    activityBox.style.display = 'flex';
    idCard?.classList.add('expanded');
  }

  if (document.querySelectorAll('.rich-timer').length > 0) {
    richInterval = setInterval(updateRichPresenceTimers, 1000);
  }
}

function startWebSocket() {
  socket = new WebSocket('wss://api.lanyard.rest/socket');
  socket.addEventListener('open', () => {
    console.log("WebSocket connection opened.");
    socket.send(JSON.stringify({
      op: 2,
      d: { subscribe_to_id: userId, api_key: apiKey }
    }));
  });
  socket.addEventListener('message', event => {
    try {
      const parsed = JSON.parse(event.data);
      const { t: type, d: data, op } = parsed;
      if (op === 1) {
        socket.send(JSON.stringify({
          op: 2,
          d: { subscribe_to_id: userId, api_key: apiKey }
        }));
      }
      if (type === 'INIT_STATE' || type === 'PRESENCE_UPDATE') {
        console.log("Received data:", parsed);
        renderActivity(data);
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error, event.data);
    }
  });
  socket.addEventListener('error', event => {
    console.error("WebSocket error:", event);
  });
  socket.addEventListener('close', () => {
    console.warn("WebSocket closed, reconnecting in 5 seconds...");
    setTimeout(startWebSocket, 5000);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  startWebSocket();
});
