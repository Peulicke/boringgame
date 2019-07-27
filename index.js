var express = require('express');
var http = require('http');
var WebSocket = require('ws');

var app = express();
app.use(express.static(__dirname + '/www'));

var server = http.createServer(app);
var wss = new WebSocket.Server({server});

wss.on('connection', function(ws) {
    ws.on('message', function(event) {
        ws.send(JSON.stringify(event));
    });
});

server.listen(process.env.PORT || 5000);