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