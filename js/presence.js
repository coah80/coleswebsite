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

async function handleActivity(data) {
  const now = Date.now();
  const discordBox = document.getElementById('discord-activity');
  let html = '';

  const statusDot = document.querySelector('.status-dot');
  const status = data.discord_status;
  statusDot.className = `status-dot status-${status}`;

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
    updateProgressBar(s.timestamps.start, s.timestamps.end);

    if (!musicLogs.length || musicLogs[0].track_id !== s.track_id || now - musicLogs[0].loggedAt > 30000) {
      musicLogs.unshift({
        track_id: s.track_id,
        song: s.song,
        artist: s.artist,
        album: s.album,
        album_art_url: s.album_art_url,
        loggedAt: now
      });

      if (musicLogs.length > 300) musicLogs.pop();
      handleActivity(msg.d);
    }
    if (msg.op === 1) {
      socket.send(JSON.stringify({ op: 2, d: { subscribe_to_id: userId, api_key: apiKey } }));
    }
  };
