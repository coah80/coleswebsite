const userId = '355470689089748992'; // your Discord user ID
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
  const elapsed = now - start;
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

    if (spotify) {
      const wrapper = document.createElement('div');
      wrapper.className = 'music-wrapper';

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
    } else {
      const rich = activities.find(act => act.type === 0 && act.name !== 'Custom Status');
      if (rich) {
        const img = document.createElement('img');
        if (rich.assets?.large_image?.startsWith('mp:external')) {
          img.src = `https://cdn.discordapp.com/${rich.assets.large_image}`;
        } else {
          img.src = `https://cdn.discordapp.com/app-assets/${rich.application_id}/${rich.assets.large_image}.png`;
        }
        img.className = 'album-art';
        activityBox.appendChild(img);

        const text = document.createElement('div');
        text.className = 'activity-details';
        text.innerHTML = `<strong>${rich.name}</strong><br>${rich.details || ''}<br>${rich.state || ''}`;
        activityBox.appendChild(text);
      } else {
        activityBox.textContent = 'No activity currently.';
      }
    }
  } catch (e) {
    console.error(e);
    document.getElementById('discord-activity').textContent = 'Unable to fetch activity.';
  }
}

fetchDiscordActivity();
setInterval(fetchDiscordActivity, 30000);
