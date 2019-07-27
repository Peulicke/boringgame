var express = require('express');
var http = require('http');
var WebSocket = require('ws');

var app = express();
app.use(express.static(__dirname + '/www'));

var server = http.createServer(app);
var wss = new WebSocket.Server({server});

var connections = [];

wss.on('connection', function(ws) {
    connections.push(ws);
    ws.on('message', function(msg) {
        ws.send(JSON.stringify(wss.clients.size));
    });
});

server.listen(process.env.PORT || 5000);