const http = require('http');
const WebSocket = require('ws');
const app = require('./app');
const ContainerController = require('./controller/container');

const containerController = new ContainerController();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  const urlParts = req.url.split('/');
  const containerId = decodeURIComponent(urlParts.pop());

  if (!containerId) {
    ws.close();
    return;
  }
  containerController.execShell(containerId, ws);
});

server.listen(3500, () => {
  console.log('App is running on port 3500.');
});
