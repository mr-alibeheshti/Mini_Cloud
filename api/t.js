const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.shell((err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      console.log('Stream :: close');
      conn.end();
    }).on('data', (data) => {
      console.log('OUTPUT: ' + data);
    });
    stream.end('uname -a\nexit\n');
  });
}).connect({
  host: '192.168.100.111',
  port: 22,
  username: 'vm5',
  password: 'vm5' // یا privateKey: require('fs').readFileSync('/path/to/your/private/key')
});
