const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

async function fetchWithRetry(url, options = {}, retries = MAX_RETRIES) {
  try {
    return await fetch(url, options);
  } catch (error) {
    if (retries <= 0) throw error;
    
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    return fetchWithRetry(url, options, retries - 1);
  }
}

async function fetchLogs() {
  try {
    const baseUrl = window._g();
    
    const loadEmptyIfFailed = async (url) => {
      try {
        const response = await fetchWithRetry(url);
        if (!response.ok) return null;
        return await response.json();
      } catch (err) {
        console.error(`Failed to fetch ${url}: ${err.message}`);
        return null;
      }
    };
    
    const [musicData, gameData] = await Promise.all([
      loadEmptyIfFailed(`${baseUrl}/musicLogs.json`),
      loadEmptyIfFailed(`${baseUrl}/gameLogs.json`)
    ]);

    window.musicLogs = musicData ? (Array.isArray(musicData) ? musicData : Object.values(musicData)) : [];
    window.gameLogs = gameData ? (Array.isArray(gameData) ? gameData : Object.values(gameData)) : [];
    
    musicLogs = window.musicLogs;
    gameLogs = window.gameLogs;

    if (musicLogs.length > 0) musicLogs.sort((a, b) => b.loggedAt - a.loggedAt);
    if (gameLogs.length > 0) gameLogs.sort((a, b) => b.loggedAt - a.loggedAt);
    
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
  let failedSaves = 0;
  
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
          if (musicToSave.length > 0) musicToSave.sort((a, b) => b.loggedAt - a.loggedAt);
          if (gamesToSave.length > 0) gamesToSave.sort((a, b) => b.loggedAt - a.loggedAt);
        }

        await Promise.all([
          fetchWithRetry(`${baseUrl}/musicLogs.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(musicToSave)
          }),
          fetchWithRetry(`${baseUrl}/gameLogs.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(gamesToSave)
          })
        ]);
        
        failedSaves = 0;
        pendingSave = false;
      } catch (err) {
        failedSaves++;
        
        if (failedSaves < 5) {
          setTimeout(saveLogs, 5000 * failedSaves);
        }
      }
      
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