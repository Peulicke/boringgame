var express = require('express');
var http = require('http');
var WebSocket = require('ws');

var app = express();
app.use(express.static(__dirname + '/www'));

var server = http.createServer(app);
var wss = new WebSocket.Server({server});

wss.on('connection', function(ws) {
    ws.on('message', function(msg) {
        var ids = [];
        wss.clients.forEach(function(client) {
            ids.push(client.id);
        });
        ws.send(JSON.stringify(ids));
    });
});

server.listen(process.env.PORT || 5000);