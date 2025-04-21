function renderMusicLogs() {
  try {
    // Check if the DOM elements exist
    const perPageElement = document.getElementById('music-per-page');
    const container = document.getElementById('music-logs');
    const pagination = document.getElementById('music-pages');
    
    if (!perPageElement || !container || !pagination) {
      console.error("Required music DOM elements not found");
      return;
    }
    
    // Make sure musicLogs exists and is an array
    if (!Array.isArray(musicLogs)) {
      console.error("musicLogs is not an array:", musicLogs);
      musicLogs = [];
    }

    const perPage = +perPageElement.value || 30;
    
    const pageCount = Math.ceil(musicLogs.length / perPage) || 1;
    let currentPage = +pagination.dataset.page || 1;
    if (currentPage > pageCount) currentPage = pageCount;
    if (currentPage < 1) currentPage = 1;
    pagination.dataset.page = currentPage;

    const start = (currentPage - 1) * perPage;
    const logsToShow = musicLogs.slice(start, start + perPage);

    container.innerHTML = logsToShow.map(log => {
      if (!log) return '';
      
      // Handle missing values
      const track_id = log.track_id || '';
      const song = log.song || 'Unknown Track';
      const artist = log.artist || 'Unknown Artist';
      const album = log.album || 'Unknown Album';
      const album_art_url = log.album_art_url || 'icons/spotify.png';
      const loggedAt = log.loggedAt || Date.now();
      
      return `
        <div class="music-wrapper">
          <img src="${album_art_url}" class="album-art" onerror="this.src='icons/spotify.png'">
          <div class="music-info">
            <a class="song-title" href="https://open.spotify.com/track/${track_id}" target="_blank">${song}</a>
            <div class="artist">${artist} • ${album}</div>
            <div class="artist">${formatDateTime(loggedAt)}</div>
          </div>
        </div>
      `;
    }).join('');

    pagination.innerHTML = Array.from({ length: pageCount }, (_, i) => {
      const num = i + 1;
      return `<button onclick="goToMusicPage(${num})">${num}</button>`;
    }).join('');
    
    // Hide loading indicator if it's visible
    const loadingElem = document.getElementById('music-loading');
    if (loadingElem) {
      loadingElem.style.display = 'none';
    }
  } catch (err) {
    console.error("Error rendering music logs:", err);
    // Show error in the container
    const container = document.getElementById('music-logs');
    if (container) {
      container.innerHTML = '<div class="error">Error loading music data. Please refresh the page.</div>';
    }
  }
}

function goToMusicPage(num) {
  try {
    const pagination = document.getElementById('music-pages');
    if (pagination) {
      pagination.dataset.page = num;
      renderMusicLogs();
    }
  } catch (err) {
    console.error("Error navigating music pages:", err);
  }
}