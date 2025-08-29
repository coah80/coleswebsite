function updateProgressBar(start, end) {
  clearInterval(progressInterval);
  const discordBox = document.getElementById('discord-activity');

  progressInterval = setInterval(() => {
    const elapsed = Date.now() - start;
    const total = end - start;
    const progress = Math.min(Math.max(elapsed / total, 0), 1) * 100;

    const timeElems = discordBox.querySelectorAll('.spotify-progress .time');
    const fillBar = discordBox.querySelector('.spotify-progress .fill');

    if (!fillBar || timeElems.length !== 2) return;

    timeElems[0].textContent = formatTime(elapsed);
    timeElems[1].textContent = formatTime(total);
    fillBar.style.width = `${progress}%`;

    if (elapsed >= total) clearInterval(progressInterval);
  }, 1000);
}

async function handleActivity(data) {
  if (!data) {
    console.error("No data received in handleActivity");
    return;
  }
  
  const now = Date.now();
  const discordBox = document.getElementById('discord-activity');
  
  if (!discordBox) {
    console.error("Discord activity box not found");
    return;
  }
  
  let html = '';

  // Update status dot
  const statusDot = document.querySelector('.status-dot');
  if (statusDot) {
    const status = data.discord_status || 'offline';
    statusDot.className = `status-dot status-${status}`;
  }

  try {
    // Handle Spotify activity
    if (data.spotify) {
      try {
        const s = data.spotify;
        
        if (!s.timestamps || !s.timestamps.start || !s.timestamps.end) {
          console.warn("Spotify data missing timestamps:", s);
          s.timestamps = s.timestamps || {};
          s.timestamps.start = s.timestamps.start || now - 60000;
          s.timestamps.end = s.timestamps.end || now + 180000;
        }
        
        const total = s.timestamps.end - s.timestamps.start;
        const elapsed = now - s.timestamps.start;
        const progress = Math.min(Math.max(elapsed / total, 0), 1) * 100;
        
        const albumArt = s.album_art_url || 'icons/spotify.png';
        const trackId = s.track_id || '';

        html += `
          <div class="presence-entry spotify-presence">
            <img src="${albumArt}" class="album-art" onerror="this.src='icons/spotify.png'">
            <div class="music-info">
              <a class="song-title" href="https://open.spotify.com/track/${trackId}" target="_blank">
                <img src="icons/spotify.png" class="spotify-icon" />
                ${s.song || 'Unknown Track'}
              </a>
              <div class="artist">${s.artist || 'Unknown Artist'} • ${s.album || 'Unknown Album'}</div>
              <div class="spotify-progress">
                <div class="time">${formatTime(elapsed)}</div>
                <div class="bar"><div class="fill" style="width:${progress}%"></div></div>
                <div class="time">${formatTime(total)}</div>
              </div>
            </div>
          </div>
        `;

        updateProgressBar(s.timestamps.start, s.timestamps.end);

        // Log the track if it's new
        if (!musicLogs.length || musicLogs[0].track_id !== s.track_id || now - musicLogs[0].loggedAt > 30000) {
          try {
            musicLogs.unshift({
              track_id: s.track_id || '',
              song: s.song || 'Unknown Track',
              artist: s.artist || 'Unknown Artist',
              album: s.album || 'Unknown Album',
              album_art_url: albumArt,
              loggedAt: now
            });

            if (musicLogs.length > 300) musicLogs.pop();
            await saveLogs();
          } catch (err) {
            console.error("Error logging music:", err);
          }
        }
      } catch (err) {
        console.error("Error processing Spotify data:", err);
      }
    } else {
      clearInterval(progressInterval);
    }

    // Handle activities (games)
    if (data.activities && Array.isArray(data.activities)) {
      const games = data.activities.filter(a => a && a.type === 0 && a.name !== 'Custom Status');
      const currentGame = games[0];

      if (currentGame) {
        try {
          const gameKey = `${currentGame.name}:${currentGame.details || ''}:${currentGame.state || ''}`;
          const top = gameLogs[0];
          const topKey = top ? `${top.name}:${top.details || ''}:${top.state || ''}` : '';

          if (gameKey !== topKey) {
            try {
              gameLogs.unshift({
                name: currentGame.name || 'Unknown Game',
                details: currentGame.details || '',
                state: currentGame.state || '',
                icon: currentGame.application_id || null,
                loggedAt: now
              });

              if (gameLogs.length > 300) gameLogs = gameLogs.slice(0, 300);
              await saveLogs();
            } catch (err) {
              console.error("Error logging game:", err);
            }
          }
        } catch (err) {
          console.error("Error processing game data:", err);
        }
      }

      if (games.length > 0) {
        games.forEach(g => {
          try {
            const icon = g.application_id
              ? `https://dcdn.dstn.to/app-icons/${g.application_id}?ext=webp&size=64`
              : 'icons/discord.svg';

            html += `
              <div class="presence-entry">
                <img src="${icon}" class="album-art" onerror="this.src='icons/discord.svg'">
                <div class="music-info">
                  <div class="song-title">${g.name || 'Playing a game'}</div>
                  <div class="artist">${g.details || ''}</div>
                  <div class="artist">${g.state || ''}</div>
                </div>
              </div>
            `;
          } catch (err) {
            console.error("Error rendering game:", err);
          }
        });
      }
    }
  } catch (err) {
    console.error("Error in activity processing:", err);
  }

  try {
    discordBox.innerHTML = html || 'Currently working on YouTube content!';
    discordBox.classList.toggle('active', !!html);
  } catch (err) {
    console.error("Error updating Discord box:", err);
  }
}