const renderMusicLogs = (() => {
  let currentPerPage = 0;
  let lastRenderCount = 0;
  let cachedHTML = '';
  
  return function() {
    const musicLogsData = window.musicLogs || [];
    const perPage = +document.getElementById('music-per-page').value;
    const container = document.getElementById('music-logs');
    const pagination = document.getElementById('music-pages');
  
    const sameData = lastRenderCount === musicLogsData.length && currentPerPage === perPage;
    
    if (!sameData) {
      const pageCount = Math.ceil(musicLogsData.length / perPage);
      let currentPage = +pagination.dataset.page || 1;
      if (currentPage > pageCount) currentPage = pageCount;
      if (currentPage < 1) currentPage = 1;
      pagination.dataset.page = currentPage;
    
      const start = (currentPage - 1) * perPage;
      const logsToShow = musicLogsData.slice(start, start + perPage);
    
      cachedHTML = logsToShow.map(log => `
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
      
      lastRenderCount = musicLogsData.length;
      currentPerPage = perPage;
    }
    
    container.innerHTML = cachedHTML;
  };
})();

function goToMusicPage(num) {
  document.getElementById('music-pages').dataset.page = num;
  renderMusicLogs();
}

window.renderMusicLogs = renderMusicLogs;
window.goToMusicPage = goToMusicPage;