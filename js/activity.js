let activityLogs = [];
let currentFilter = 'all';

function renderActivityLogs() {
  try {
    const perPageElement = document.getElementById('activity-per-page');
    const container = document.getElementById('activity-logs');
    const pagination = document.getElementById('activity-pages');
    
    if (!perPageElement || !container || !pagination) {
      console.error("Required activity DOM elements not found");
      return;
    }
    
    // Combine music and game logs with their types
    activityLogs = [
      ...musicLogs.map(log => ({ ...log, type: 'music' })),
      ...gameLogs.map(log => ({ ...log, type: 'game' }))
    ];
    
    // Sort all logs by timestamp (newest first)
    activityLogs.sort((a, b) => b.loggedAt - a.loggedAt);

    // Filter logs based on current filter
    const filteredLogs = currentFilter === 'all' 
      ? activityLogs 
      : activityLogs.filter(log => log.type === currentFilter);

    const perPage = +perPageElement.value || 30;
    
    const pageCount = Math.ceil(filteredLogs.length / perPage) || 1;
    let currentPage = +pagination.dataset.page || 1;
    if (currentPage > pageCount) currentPage = pageCount;
    if (currentPage < 1) currentPage = 1;
    pagination.dataset.page = currentPage;

    const start = (currentPage - 1) * perPage;
    const logsToShow = filteredLogs.slice(start, start + perPage);

    container.innerHTML = logsToShow.map(log => {
      if (!log) return '';
      
      if (log.type === 'music') {
        const track_id = log.track_id || '';
        const song = log.song || 'Unknown Track';
        const artist = log.artist || 'Unknown Artist';
        const album = log.album || 'Unknown Album';
        const album_art_url = log.album_art_url || 'icons/spotify.png';
        const loggedAt = log.loggedAt || Date.now();
        
        return `
          <div class="activity-wrapper" style="position: relative;">
            <div class="activity-type type-music">Music</div>
            <img src="${album_art_url}" class="activity-icon" onerror="this.src='icons/spotify.png'">
            <div class="activity-info">
              <a class="activity-title" href="https://open.spotify.com/track/${track_id}" target="_blank">
                <img src="icons/spotify.png" style="width: 16px; height: 16px;"> ${song}
              </a>
              <div class="activity-subtitle">${artist} • ${album}</div>
              <div class="activity-subtitle">${formatDateTime(loggedAt)}</div>
            </div>
          </div>
        `;
      } else {
        const name = log.name || 'Unknown Game';
        const details = log.details || '';
        const state = log.state || '';
        const loggedAt = log.loggedAt || Date.now();
        
        const icon = log.icon
          ? `https://dcdn.dstn.to/app-icons/${log.icon}?ext=webp&size=64`
          : 'icons/discord.svg';
        
        return `
          <div class="activity-wrapper" style="position: relative;">
            <div class="activity-type type-game">Game</div>
            <img src="${icon}" class="activity-icon" onerror="this.src='icons/discord.svg'">
            <div class="activity-info">
              <div class="activity-title">${name}</div>
              <div class="activity-subtitle">${details}</div>
              <div class="activity-subtitle">${state}</div>
              <div class="activity-subtitle">${formatDateTime(loggedAt)}</div>
            </div>
          </div>
        `;
      }
    }).join('');

    pagination.innerHTML = Array.from({ length: pageCount }, (_, i) => {
      const num = i + 1;
      return `<button onclick="goToActivityPage(${num})">${num}</button>`;
    }).join('');
    
    // Hide loading indicator
    const loadingElem = document.getElementById('activity-loading');
    if (loadingElem) {
      loadingElem.style.display = 'none';
    }
  } catch (err) {
    console.error("Error rendering activity logs:", err);
    const container = document.getElementById('activity-logs');
    if (container) {
      container.innerHTML = '<div class="error">Error loading activity data. Please refresh the page.</div>';
    }
  }
}

function goToActivityPage(num) {
  try {
    const pagination = document.getElementById('activity-pages');
    if (pagination) {
      pagination.dataset.page = num;
      renderActivityLogs();
    }
  } catch (err) {
    console.error("Error navigating activity pages:", err);
  }
}

function setActivityFilter(filter) {
  currentFilter = filter;
  
  // Update active state on filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  
  // Reset to page 1 and re-render
  const pagination = document.getElementById('activity-pages');
  if (pagination) {
    pagination.dataset.page = 1;
  }
  
  renderActivityLogs();
}

// Set up filter button event listeners
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setActivityFilter(btn.dataset.filter);
    });
  });
});