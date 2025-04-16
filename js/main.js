function connectSocket() {
  socket = new WebSocket('wss://api.lanyard.rest/socket');

  socket.onopen = () => {
    socket.send(JSON.stringify({ op: 2, d: { subscribe_to_id: userId, api_key: apiKey } }));
  };

  socket.onmessage = e => {
    const msg = JSON.parse(e.data);
    if (msg.t === 'INIT_STATE' || msg.t === 'PRESENCE_UPDATE') {
  socket.onclose = () => setTimeout(connectSocket, 5000);
  socket.onerror = err => console.error('WebSocket error:', err);
}

window.onpopstate = () => {
  const tab = location.pathname.replace('/', '') || 'home';
document.addEventListener('DOMContentLoaded', async () => {
  connectSocket();

  document.querySelectorAll('.card-tab').forEach(btn => {