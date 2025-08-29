function switchTab(tabName, fromPop = false) {
  const card = document.getElementById('main-card');
  const home = document.getElementById('home-tab');
  const activity = document.getElementById('activity-tab');
  const projects = document.getElementById('projects-tab');

  // Hide all tabs
  home.style.display = 'none';
  activity.style.display = 'none';
  projects.style.display = 'none';

  // Update tab buttons
  document.querySelectorAll('.card-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  let target;
  if (tabName === 'home') {
    card.classList.remove('expanded');
    target = home;
    if (!fromPop) history.pushState({}, '', '/');
  } else {
    card.classList.add('expanded');
    if (tabName === 'activity') {
      target = activity;
      renderActivityLogs();
      if (!fromPop) history.pushState({}, '', '/activity');
    } else if (tabName === 'projects') {
      target = projects;
      if (!fromPop) history.pushState({}, '', '/projects');
    }
  }

  if (target) {
    target.style.display = 'block';
    
    // Adjust card height for mobile
    setTimeout(() => {
      if (typeof isMobile !== 'undefined' && isMobile) {
        const viewportHeight = window.innerHeight;
        const maxHeight = Math.min(viewportHeight * 0.85, target.scrollHeight + 100);
        card.style.maxHeight = `${maxHeight}px`;
      }
    }, 10);
  }
}

// Handle browser back/forward
window.onpopstate = () => {
  const tab = location.pathname.replace('/', '') || 'home';
  switchTab(tab, true);
};

document.addEventListener('DOMContentLoaded', () => {
  // Set up tab click handlers
  document.querySelectorAll('.card-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Initialize with current URL
  const initial = location.pathname.replace('/', '') || 'home';
  switchTab(initial);
  
  // Handle window resize
  window.addEventListener('resize', () => {
    const activeTab = document.querySelector('.tab-page[style*="display: block"]');
    if (activeTab && typeof isMobile !== 'undefined' && isMobile) {
      const card = document.getElementById('main-card');
      const viewportHeight = window.innerHeight;
      const maxHeight = Math.min(viewportHeight * 0.85, activeTab.scrollHeight + 100);
      card.style.maxHeight = `${maxHeight}px`;
    }
  });
});