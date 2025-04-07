const userId = '355470689089748992'; // your actual Discord user ID

function msToMinutes(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function updateProgressBar(start, end) {
  const now = Date.now();
  const total = end - start;
  const elapsed = now - start;
  const percent = Math.min(100, (elapsed / total) * 100);
  const bar = document.querySelector('.progress-bar');
  if (bar) bar.style.width = percent + '%';
}

async function fetchDiscordActivity() {
  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${userId}`);
    const data = await res.json();
    const activityBox = document.getElementById('discord-activity');
    activityBox.innerHTML = '';

    const activities = data.data.activities;

    const spotify = data.data.spotify;
    if (spotify) {
      const img = document.createElement('img');
      img.src = spotify.album_art_url;
      activityBox.appendChild(img);

      const text = document.createElement('div');
      text.className = 'activity-details';
      text.innerHTML = `<strong>${spotify.song}</strong><br>${spotify.artist}`;
      activityBox.appendChild(text);

      const progress = document.createElement('div');
      progress.className = 'progress-container';
      progress.innerHTML = '<div class="progress-bar"></div>';
      activityBox.appendChild(progress);

      updateProgressBar(spotify.timestamps.start, spotify.timestamps.end);
    } else {
      const rich = activities.find(act => act.type === 0 && act.name !== 'Custom Status');
      if (rich) {
        const img = document.createElement('img');
        if (rich.assets?.large_image?.startsWith('mp:external')) {
          img.src = `https://cdn.discordapp.com/${rich.assets.large_image}`;
        } else if (rich.assets?.large_image?.startsWith('spotify:')) {
          img.src = `https://i.scdn.co/image/${rich.assets.large_image.replace('spotify:', '')}`;
        } else {
          img.src = `https://cdn.discordapp.com/app-assets/${rich.application_id}/${rich.assets.large_image}.png`;
        }
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
