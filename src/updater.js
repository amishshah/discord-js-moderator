const http = require('http');
const createHandler = require('github-webhook-handler');
const EventEmitter = require('events').EventEmitter;

class UpdateListener extends EventEmitter {
  constructor() {
    super();

    this.handler = createHandler({ path: '/modbothook', secret: require('./config.json').secret });

    this.server = http.createServer((req, res) => {
      this.handler(req, res, () => {
        res.statusCode = 404;
        res.end('no such location');
      });
    }).listen(7777);

    this.handler.on('push', event => {
      this.emit('push', event);
    });
  }
}

module.exports = UpdateListener;
