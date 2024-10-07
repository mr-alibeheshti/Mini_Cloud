const http = require('http');
const Docker = require('dockerode');
const app = require('./app');

app.listen(3501, () => {
  console.log('App is running on port 3501.');
});
