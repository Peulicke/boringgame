var express = require('express');
var http = require('http');
var WebSocket = require('ws');

var app = express();
app.use(express.static(__dirname + '/www'));

var server = http.createServer(app);
var wss = new WebSocket.Server({server});

wss.on('connection', function(ws) {
    ws.on('message', function(msg) {
        ws.name = msg;
        var names = [];
        wss.clients.forEach(function(client) {
            names.push(client.name);
        });
        ws.send(JSON.stringify(names));
    });
});

server.listen(process.env.PORT || 5000);