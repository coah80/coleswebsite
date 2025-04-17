async function fetchLogs() {
  try {
    const baseUrl = window._g();
    
    const [musicRes, gameRes] = await Promise.all([
      fetch(`${baseUrl}/musicLogs.json`),
      fetch(`${baseUrl}/gameLogs.json`)
    ]);
    
    const [musicData, gameData] = await Promise.all([
      musicRes.json(),
      gameRes.json()
    ]);

    musicLogs = musicData ? (Array.isArray(musicData) ? musicData : Object.values(musicData)) : [];
    gameLogs = gameData ? (Array.isArray(gameData) ? gameData : Object.values(gameData)) : [];

    musicLogs.sort((a, b) => b.loggedAt - a.loggedAt);
    gameLogs.sort((a, b) => b.loggedAt - a.loggedAt);
    
    window.musicLogs = musicLogs;
    window.gameLogs = gameLogs;
    
    return { musicLogs, gameLogs };
  } catch (err) {
    window.musicLogs = [];
    window.gameLogs = [];
    return { musicLogs: [], gameLogs: [] };
  }
}

const saveLogs = (() => {
  let saveTimer = null;
  let pendingSave = false;
  
  return async function() {
    if (saveTimer) {
      pendingSave = true;
      return;
    }
    
    saveTimer = setTimeout(async () => {
      try {
        const baseUrl = window._g();
        
        const musicToSave = window.musicLogs || musicLogs;
        const gamesToSave = window.gameLogs || gameLogs;
        
        if (pendingSave) {
          musicToSave.sort((a, b) => b.loggedAt - a.loggedAt);
          gamesToSave.sort((a, b) => b.loggedAt - a.loggedAt);
        }

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
        
        pendingSave = false;
      } catch (err) {}
      
      saveTimer = null;
      if (pendingSave) {
        pendingSave = false;
        saveLogs();
      }
    }, 1000);
  };
})();

window.fetchLogs = fetchLogs;
window.saveLogs = saveLogs;