const renderGameLogs = (() => {
  let currentPerPage = 0;
  let lastRenderCount = 0;
  let cachedHTML = '';
  
  return function() {
    const gameLogsData = window.gameLogs || [];
    const perPage = +document.getElementById('games-per-page').value;
    const container = document.getElementById('game-logs');
    const pagination = document.getElementById('game-pages');
  
    const sameData = lastRenderCount === gameLogsData.length && currentPerPage === perPage;
    
    if (!sameData) {
      const pageCount = Math.ceil(gameLogsData.length / perPage);
      let currentPage = +pagination.dataset.page || 1;
      if (currentPage > pageCount) currentPage = pageCount;
      if (currentPage < 1) currentPage = 1;
      pagination.dataset.page = currentPage;
    
      const start = (currentPage - 1) * perPage;
      const logsToShow = gameLogsData.slice(start, start + perPage);
    
      cachedHTML = logsToShow.map(log => {
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
      
      lastRenderCount = gameLogsData.length;
      currentPerPage = perPage;
    }
    
    container.innerHTML = cachedHTML;
  };
})();

function goToGamePage(num) {
  document.getElementById('game-pages').dataset.page = num;
  renderGameLogs();
}

window.renderGameLogs = renderGameLogs;
window.goToGamePage = goToGamePage;