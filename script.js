const userId = '355470689089748992';
let progressInterval;

function msToMinutes(ms) {
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
  if (currentTime) currentTime.textContent = msToMinutes(elapsed);
  if (totalTime) totalTime.textContent = msToMinutes(total);
}

function clearProgressUpdater() {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
}

async function fetchDiscordActivity() {
  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${userId}`);
    const data = await res.json();
    const activityBox = document.getElementById('discord-activity');
    activityBox.innerHTML = '';
    clearProgressUpdater();

    const spotify = data.data.spotify;
    const activities = data.data.activities;

    let contentAdded = false;

    if (spotify) {
      const wrapper = document.createElement('div');
      wrapper.className = 'music-wrapper';
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'row';
      wrapper.style.alignItems = 'center';
      wrapper.style.width = '100%';
      wrapper.style.gap = '12px';
      wrapper.style.marginBottom = '12px';

      const albumArt = document.createElement('img');
      albumArt.src = spotify.album_art_url;
      albumArt.className = 'album-art';
      wrapper.appendChild(albumArt);

      const musicInfo = document.createElement('div');
      musicInfo.className = 'music-info';

      const title = document.createElement('div');
      title.className = 'song-title';
      title.textContent = spotify.song;
      musicInfo.appendChild(title);

      const artist = document.createElement('div');
      artist.className = 'artist';
      artist.textContent = `${spotify.artist} • ${spotify.album}`;
      musicInfo.appendChild(artist);

      const progress = document.createElement('div');
      progress.className = 'progress-container';
      progress.innerHTML = '<div class="progress-bar"></div>';
      musicInfo.appendChild(progress);

      const timeRow = document.createElement('div');
      timeRow.className = 'time-stamps';
      timeRow.innerHTML = `
        <span id="current-time">${msToMinutes(Date.now() - spotify.timestamps.start)}</span>
        <span id="total-time">${msToMinutes(spotify.timestamps.end - spotify.timestamps.start)}</span>
      `;
      musicInfo.appendChild(timeRow);

      wrapper.appendChild(musicInfo);
      activityBox.appendChild(wrapper);

      updateSpotifyProgress(spotify.timestamps.start, spotify.timestamps.end);
      progressInterval = setInterval(() => {
        updateSpotifyProgress(spotify.timestamps.start, spotify.timestamps.end);
      }, 1000);

      contentAdded = true;
    }

    const filteredActivities = activities.filter(
      act => act.type === 0 && act.name !== 'Custom Status'
    );

    filteredActivities.forEach((act) => {
      const container = document.createElement('div');
      container.className = 'music-wrapper';
      container.style.display = 'flex';
      container.style.flexDirection = 'row';
      container.style.alignItems = 'center';
      container.style.width = '100%';
      container.style.gap = '12px';
      container.style.marginBottom = '12px';

      const img = document.createElement('img');
      if (act.assets?.large_image?.startsWith('mp:external')) {
        img.src = `https://cdn.discordapp.com/${act.assets.large_image}`;
      } else {
        img.src = `https://cdn.discordapp.com/app-assets/${act.application_id}/${act.assets.large_image}.png`;
      }
      img.className = 'album-art';
      container.appendChild(img);

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

      container.appendChild(text);
      activityBox.appendChild(container);

      contentAdded = true;
    });

    if (!contentAdded) {
      activityBox.textContent = 'No activity currently.';
    }
  } catch (e) {
    console.error(e);
    document.getElementById('discord-activity').textContent = 'Unable to fetch activity.';
  }
}

fetchDiscordActivity();
setInterval(fetchDiscordActivity, 30000);
