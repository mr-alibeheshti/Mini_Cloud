const http = require('http');
const WebSocket = require('ws');
const Docker = require('dockerode');

const app = require('./app'); 
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  const urlParts = req.url.split('/');
  const containerId = decodeURIComponent(urlParts.pop());

  if (!containerId) {
    ws.close();
    return;
  }

  const container = docker.getContainer(containerId);

  container.exec({
    AttachStdin: true,
    AttachStdout: true,
    AttachStderr: true,
    Tty: true,
    Cmd: ['bash'],
  }, (err, exec) => {
    if (err) {
      ws.send(`Error: ${err.message}`);
      ws.close();
      return;
    }

    exec.start({ hijack: true, stdin: true }, (err, stream) => {
      if (err) {
        ws.send(`Error: ${err.message}`);
        ws.close();
        return;
      }

      stream.on('data', (chunk) => {
        ws.send(chunk);
      });

      stream.on('end', () => {
        ws.close();
      });

      stream.on('error', (streamErr) => {
        ws.send(`Stream Error: ${streamErr.message}`);
      });

      ws.on('message', (message) => {
        stream.write(message);
      });

      ws.on('close', () => {
        stream.end();
      });

      ws.on('error', (wsErr) => {
        stream.end();
        console.error(`WebSocket Error: ${wsErr.message}`);
      });
    });
  });
});

server.listen(3500, () => {
  console.log('App is running on port 3500.');
});
