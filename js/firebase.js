const firebaseBase = 'https://cole-logs-a8c81-default-rtdb.firebaseio.com';
let socket;

let musicLogs = [];
let gameLogs = [];
let progressInterval = null;

async function fetchLogs() {
  try {
    console.log("Fetching logs from Firebase...");
    
    // Hide any previous error messages
    const loadingElement = document.getElementById('activity-loading');
    if (loadingElement) {
      loadingElement.innerHTML = 'Loading activity data...';
    }
    
    const [musicRes, gameRes] = await Promise.all([
      fetch(`${firebaseBase}/musicLogs.json`).then(r => {
        if (!r.ok) throw new Error(`Failed to fetch music logs: ${r.status}`);
        return r.json();
      }),
      fetch(`${firebaseBase}/gameLogs.json`).then(r => {
        if (!r.ok) throw new Error(`Failed to fetch game logs: ${r.status}`);
        return r.json();
      })
    ]);

    // Process music logs
    if (musicRes) {
      musicLogs = Array.isArray(musicRes) ? musicRes : Object.values(musicRes || {});
      musicLogs = musicLogs.filter(log => log && log.loggedAt);
      musicLogs.sort((a, b) => b.loggedAt - a.loggedAt);
    } else {
      console.log("No music logs found");
      musicLogs = [];
    }

    // Process game logs
    if (gameRes) {
      gameLogs = Array.isArray(gameRes) ? gameRes : Object.values(gameRes || {});
      gameLogs = gameLogs.filter(log => log && log.loggedAt);
      gameLogs.sort((a, b) => b.loggedAt - a.loggedAt);
    } else {
      console.log("No game logs found");
      gameLogs = [];
    }

    console.log(`Fetched ${musicLogs.length} music logs and ${gameLogs.length} game logs`);
  } catch (err) {
    console.error('Failed to fetch logs:', err);
    
    const loadingElement = document.getElementById('activity-loading');
    if (loadingElement) {
      loadingElement.innerHTML = 'Failed to load activity data. Please try again later.';
    }
    
    musicLogs = musicLogs || [];
    gameLogs = gameLogs || [];
  }
}

async function saveLogs() {
  try {
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
    
    console.log("Logs saved successfully");
  } catch (err) {
    console.error('Failed to save logs:', err);
  }
}