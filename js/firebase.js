const firebaseBase = 'https://cole-logs-a8c81-default-rtdb.firebaseio.com';
let socket;

let musicLogs = [];
let gameLogs = [];
let progressInterval = null;

async function fetchLogs() {
  try {
    const [musicRes, gameRes] = await Promise.all([
      fetch(`${firebaseBase}/musicLogs.json`).then(r => r.json()),
      fetch(`${firebaseBase}/gameLogs.json`).then(r => r.json())
    ]);

    musicLogs = Array.isArray(musicRes) ? musicRes : Object.values(musicRes || {});
    gameLogs = Array.isArray(gameRes) ? gameRes : Object.values(gameRes || {});

    musicLogs.sort((a, b) => b.loggedAt - a.loggedAt);
    gameLogs.sort((a, b) => b.loggedAt - a.loggedAt);
  } catch (err) {
    console.error('failed to fetch logs:', err);
  }
}

async function saveLogs() {
  musicLogs.sort((a, b) => b.loggedAt - a.loggedAt);
  gameLogs.sort((a, b) => b.loggedAt - a.loggedAt);

  await Promise.all([
    fetch(`${firebaseBase}/musicLogs.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(musicLogs)
    }),
    fetch(`${firebaseBase}/gameLogs.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gameLogs)
    })
  ]);
}

      await saveLogs();
    }
  } else {
    clearInterval(progressInterval);
  }

  const games = data.activities.filter(a => a.type === 0 && a.name !== 'Custom Status');
  const currentGame = games[0];

  if (currentGame) {
    const gameKey = `${currentGame.name}:${currentGame.details || ''}:${currentGame.state || ''}`;
    const top = gameLogs[0];
    const topKey = top ? `${top.name}:${top.details || ''}:${top.state || ''}` : '';

    if (gameKey !== topKey) {
      gameLogs.unshift({
        name: currentGame.name,
        details: currentGame.details || '',
        state: currentGame.state || '',
        icon: currentGame.application_id || null,
        loggedAt: now
      });

      if (gameLogs.length > 300) gameLogs = gameLogs.slice(0, 300);
      await saveLogs();
    }
  }

  if (games.length > 0) {
    games.forEach(g => {
      const icon = g.application_id
        ? `https://dcdn.dstn.to/app-icons/${g.application_id}?ext=webp&size=64`
        : 'https://cdn.discordapp.com/embed/avatars/0.png';

      html += `
        <div class="presence-entry">
          <img src="${icon}" class="album-art">
          <div class="music-info">
            <div class="song-title">${g.name}</div>
            <div class="artist">${g.details || ''}</div>
            <div class="artist">${g.state || ''}</div>
          </div>
        </div>
      `;
    });
  }

  discordBox.innerHTML = html || 'Not currently playing anything.';
  discordBox.classList.toggle('active', !!html);
}

  await fetchLogs();