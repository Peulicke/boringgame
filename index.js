var express = require('express');
var http = require('http');
var ws = require('ws');

const app = express();
app.use(express.static(__dirname + '/www'));

const server = http.createServer(app);
const wss = new ws.Server({server});

wss.on('connection', function(ws) {
    const id = setInterval(function() {
        ws.send(JSON.stringify(process.memoryUsage()));
    }, 100);
    ws.on('close', function() {
        clearInterval(id);
    });
});

server.listen(process.env.PORT || 5000);