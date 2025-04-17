async function fetchLogs() {
  try {
    const baseUrl = window._g();
    const [musicRes, gameRes] = await Promise.all([
      fetch(`${baseUrl}/musicLogs.json`).then(r => r.json()),
      fetch(`${baseUrl}/gameLogs.json`).then(r => r.json())
    ]);

    window.musicLogs = Array.isArray(musicRes) ? musicRes : Object.values(musicRes || {});
    window.gameLogs = Array.isArray(gameRes) ? gameRes : Object.values(gameRes || {});
    
    musicLogs = window.musicLogs;
    gameLogs = window.gameLogs;

    musicLogs.sort((a, b) => b.loggedAt - a.loggedAt);
    gameLogs.sort((a, b) => b.loggedAt - a.loggedAt);
  } catch (err) {}
}

async function saveLogs() {
  try {
    const musicToSave = window.musicLogs || musicLogs;
    const gamesToSave = window.gameLogs || gameLogs;
    
    musicToSave.sort((a, b) => b.loggedAt - a.loggedAt);
    gamesToSave.sort((a, b) => b.loggedAt - a.loggedAt);

    const baseUrl = window._g();
    await Promise.all([
      fetch(`${baseUrl}/musicLogs.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(musicToSave)
      }),
      fetch(`${baseUrl}/gameLogs.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gamesToSave)
      })
    ]);
  } catch (err) {}
}

window.fetchLogs = fetchLogs;
window.saveLogs = saveLogs;