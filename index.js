var express = require('express');
var http = require('http');
var WebSocket = require('ws');

var app = express();
app.use(express.static(__dirname + '/www'));

var server = http.createServer(app);
var wss = new WebSocket.Server({server});

wss.on('connection', function(ws) {
    ws.on('message', function(msg) {
        var data = JSON.parse(msg);
        for(var i = 0; i < Object.keys(data).length; ++i){
            ws[Object.keys(data)[i]] = data[Object.keys(data)[i]];
        }
        var res = [];
        wss.clients.forEach(function(client) {
            res.push(client);
        });
        ws.send(JSON.stringify(res));
    });
});

server.listen(process.env.PORT || 5000);