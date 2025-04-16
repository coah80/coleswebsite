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
    return `<button onclick="goToMusicPage(${num})">${num}</button>`;
  }).join('');
}

function goToMusicPage(num) {
  document.getElementById('music-pages').dataset.page = num;
  renderMusicLogs();
}

  renderMusicLogs();
      renderMusicLogs();
      if (!fromPop) history.pushState({}, '', '/music');
    } else if (tabName === 'games') {
      target = games;