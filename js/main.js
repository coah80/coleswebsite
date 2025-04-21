const userId = '761701756119547955';
const _kp = ['1cf73df5','72dac3f3','ce085aa2','b4d6ef83'];
const apiKey = _kp.join('');

function connectSocket(){
  socket = new WebSocket('wss://api.lanyard.rest/socket');
  socket.onopen = () => {
    console.log("WebSocket connected, subscribing to user:", userId);
    socket.send(JSON.stringify({op:2,d:{subscribe_to_id:userId,api_key:apiKey}}));
  };
  socket.onmessage = e => {
    try {
      const msg = JSON.parse(e.data);
      if(msg.t==='INIT_STATE'||msg.t==='PRESENCE_UPDATE') handleActivity(msg.d);
      if(msg.op===1) socket.send(JSON.stringify({op:2,d:{subscribe_to_id:userId,api_key:apiKey}}));
    } catch(err) {
      console.error("Error handling WebSocket message:",err);
    }
  };
  socket.onclose = () => {
    console.log("WebSocket closed, reconnecting in 5 seconds");
    setTimeout(connectSocket,5000);
  };
  socket.onerror = err => console.error('WebSocket error:',err);
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log("DOM loaded, initializing application");
  
  // Show loading indicators
  document.getElementById('music-loading').style.display = 'block';
  document.getElementById('game-loading').style.display = 'block';
  
  try {
    await fetchLogs();
    // Hide loading indicators after fetching
    document.getElementById('music-loading').style.display = 'none';
    document.getElementById('game-loading').style.display = 'none';
    
    renderMusicLogs();
    renderGameLogs();
  } catch (error) {
    console.error("Error loading logs:", error);
  }
  
  // Connect to Discord presence socket
  connectSocket();
  
  // Fix tab display on mobile
  if (isMobile) {
    const card = document.getElementById('main-card');
    document.querySelectorAll('.card-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        setTimeout(() => {
          const activeTab = document.querySelector('.tab-page[style*="display: block"]');
          if (activeTab) {
            card.style.maxHeight = `${activeTab.scrollHeight + 100}px`;
          }
        }, 50);
      });
    });
  }
});
