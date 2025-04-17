
let musicLogs = [];
let gameLogs = [];
let progressInterval = null;

async function fetchLogs() {
  try {
    const baseUrl = window._g();
    const [musicRes, gameRes] = await Promise.all([
      fetch(`${baseUrl}/musicLogs.json`).then(r => r.json()),
      fetch(`${baseUrl}/gameLogs.json`).then(r => r.json())
    ]);

    musicLogs = Array.isArray(musicRes) ? musicRes : Object.values(musicRes || {});
    gameLogs = Array.isArray(gameRes) ? gameRes : Object.values(gameRes || {});

    musicLogs.sort((a, b) => b.loggedAt - a.loggedAt);
    gameLogs.sort((a, b) => b.loggedAt - a.loggedAt);
  } catch (err) {}
}

async function saveLogs() {
  musicLogs.sort((a, b) => b.loggedAt - a.loggedAt);
  gameLogs.sort((a, b) => b.loggedAt - a.loggedAt);

  const baseUrl = window._g();
  await Promise.all([
    fetch(`${baseUrl}/musicLogs.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(musicLogs)
    }),
    fetch(`${baseUrl}/gameLogs.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gameLogs)
    })
  ]);
}