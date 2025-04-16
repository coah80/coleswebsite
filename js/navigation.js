function switchTab(tabName, fromPop = false) {
  const card = document.getElementById('main-card');
  const home = document.getElementById('home-tab');
  const music = document.getElementById('music-tab');
  const games = document.getElementById('games-tab');

  home.style.display = 'none';
  music.style.display = 'none';
  games.style.display = 'none';

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
    if (tabName === 'music') {
      target = music;
      renderMusicLogs();
      if (!fromPop) history.pushState({}, '', '/music');
    } else if (tabName === 'games') {
      target = games;
      renderGameLogs();
      if (!fromPop) history.pushState({}, '', '/games');
    }
  }

  if (target) {
    target.style.display = 'block';
    card.style.maxHeight = `${target.scrollHeight + 100}px`;
  }
}

window.onpopstate = () => {
  const tab = location.pathname.replace('/', '') || 'home';
  switchTab(tab, true);
};

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.card-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  const initial = location.pathname.replace('/', '') || 'home';
  switchTab(initial);
});