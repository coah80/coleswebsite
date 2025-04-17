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

function goToGamePage(num) {
  document.getElementById('game-pages').dataset.page = num;
  renderGameLogs();
}