function renderGameLogs() {
  try {
    // Check if the DOM elements exist
    const perPageElement = document.getElementById('games-per-page');
    const container = document.getElementById('game-logs');
    const pagination = document.getElementById('game-pages');
    
    if (!perPageElement || !container || !pagination) {
      console.error("Required games DOM elements not found");
      return;
    }
    
    // Make sure gameLogs exists and is an array
    if (!Array.isArray(gameLogs)) {
      console.error("gameLogs is not an array:", gameLogs);
      gameLogs = [];
    }

    const perPage = +perPageElement.value || 30;
    
    const pageCount = Math.ceil(gameLogs.length / perPage) || 1;
    let currentPage = +pagination.dataset.page || 1;
    if (currentPage > pageCount) currentPage = pageCount;
    if (currentPage < 1) currentPage = 1;
    pagination.dataset.page = currentPage;

    const start = (currentPage - 1) * perPage;
    const logsToShow = gameLogs.slice(start, start + perPage);

    container.innerHTML = logsToShow.map(log => {
      if (!log) return '';
      
      // Handle missing values
      const name = log.name || 'Unknown Game';
      const details = log.details || '';
      const state = log.state || '';
      const loggedAt = log.loggedAt || Date.now();
      
      const icon = log.icon
        ? `https://dcdn.dstn.to/app-icons/${log.icon}?ext=webp&size=64`
        : 'icons/discord.svg';
      
      return `
        <div class="music-wrapper">
          <img src="${icon}" class="album-art" onerror="this.src='icons/discord.svg'">
          <div class="music-info">
            <div class="song-title">${name}</div>
            <div class="artist">${details}</div>
            <div class="artist">${state}</div>
            <div class="artist">${formatDateTime(loggedAt)}</div>
          </div>
        </div>
      `;
    }).join('');

    pagination.innerHTML = Array.from({ length: pageCount }, (_, i) => {
      const num = i + 1;
      return `<button onclick="goToGamePage(${num})">${num}</button>`;
    }).join('');
    
    // Hide loading indicator if it's visible
    const loadingElem = document.getElementById('game-loading');
    if (loadingElem) {
      loadingElem.style.display = 'none';
    }
  } catch (err) {
    console.error("Error rendering game logs:", err);
    // Show error in the container
    const container = document.getElementById('game-logs');
    if (container) {
      container.innerHTML = '<div class="error">Error loading game data. Please refresh the page.</div>';
    }
  }
}

function goToGamePage(num) {
  try {
    const pagination = document.getElementById('game-pages');
    if (pagination) {
      pagination.dataset.page = num;
      renderGameLogs();
    }
  } catch (err) {
    console.error("Error navigating game pages:", err);
  }
}